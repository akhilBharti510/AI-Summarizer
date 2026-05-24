import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 90_000,
});

// ─── CSRF token plumbing ──────────────────────────────────
let csrfToken = null;
let csrfPromise = null;

async function ensureCsrfToken() {
  if (csrfToken) return csrfToken;
  if (!csrfPromise) {
    csrfPromise = api
      .get('/auth/csrf')
      .then((r) => {
        csrfToken = r.data?.data?.csrfToken;
        return csrfToken;
      })
      .catch(() => null)
      .finally(() => {
        csrfPromise = null;
      });
  }
  return csrfPromise;
}

export function clearCsrf() {
  csrfToken = null;
}

const UNSAFE = ['post', 'put', 'patch', 'delete'];

api.interceptors.request.use(async (config) => {
  if (UNSAFE.includes((config.method || '').toLowerCase())) {
    const url = (config.url || '').replace(baseURL, '');
    const csrfExempt = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/forgot-password',
      '/auth/reset-password',
    ];
    const exempt = csrfExempt.some((p) => url.startsWith(p));
    if (!exempt) {
      const token = await ensureCsrfToken();
      if (token) config.headers['X-CSRF-Token'] = token;
    }
  }
  return config;
});

// ─── 401 refresh interceptor (single-flight) ──────────────
let refreshPromise = null;

async function attemptRefresh() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = api
    .post('/auth/refresh')
    .then((r) => r.data?.data?.user || null)
    .catch((e) => {
      throw e;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    if (!original || original.__isRetry) return Promise.reject(error);
    const url = (original.url || '').replace(baseURL, '');
    const isAuthEndpoint = url.startsWith('/auth/login') || url.startsWith('/auth/refresh');
    if (status === 401 && !isAuthEndpoint) {
      try {
        await attemptRefresh();
        original.__isRetry = true;
        return api(original);
      } catch {
        clearCsrf();
        return Promise.reject(error);
      }
    }
    if (status === 403 && error.response?.data?.error?.code === 'CSRF_FAILED') {
      clearCsrf();
      try {
        await ensureCsrfToken();
        original.__isRetry = true;
        return api(original);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

export function unwrap(p) {
  return p.then((r) => r.data?.data);
}
export function unwrapFull(p) {
  return p.then((r) => r.data);
}
