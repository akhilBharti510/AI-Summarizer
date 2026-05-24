# AI Summarizer — Client

React 18 + Vite + TailwindCSS + Shadcn-style UI + TanStack Query.

## Quick start

```bash
cp .env.example .env       # set VITE_API_URL etc.
npm install
npm run dev                # http://localhost:5173
```

Dev proxy forwards `/api` → `http://localhost:4000` (see `vite.config.js`),
so cookie-based auth works in development.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` / `npm run format` | Code quality |

## Notable conventions

- All API calls go through `src/services/api.js` which handles CSRF + 401-refresh transparently
- Auth state lives in the QueryClient cache (`['me']`) via `AuthContext`
- Theme toggled by class on `<html>`; default = system preference
- Each list page implements loading (Skeleton), empty, and error states
- Routes are gated by `ProtectedRoute` and `PermissionRoute`
