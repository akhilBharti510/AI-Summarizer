import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    common: {
      app: 'AI Summarizer',
      dashboard: 'Dashboard',
      summarize: 'Summarize',
      history: 'History',
      bookmarks: 'Bookmarks',
      profile: 'Profile',
      settings: 'Settings',
      admin: 'Admin',
      users: 'Users',
      roles: 'Roles',
      analytics: 'Analytics',
      auditLogs: 'Audit Logs',
      logout: 'Logout',
      login: 'Sign in',
      register: 'Create account',
      noData: 'Nothing here yet',
      retry: 'Retry',
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });

export default i18n;
