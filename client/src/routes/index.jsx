import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout.jsx';
import AppLayout from '../layouts/AppLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import PermissionRoute from './PermissionRoute.jsx';

import Landing from '../pages/public/Landing.jsx';
import Login from '../pages/public/Login.jsx';
import Register from '../pages/public/Register.jsx';
import ForgotPassword from '../pages/public/ForgotPassword.jsx';
import ResetPassword from '../pages/public/ResetPassword.jsx';

import Dashboard from '../pages/app/Dashboard.jsx';
import Summarize from '../pages/app/Summarize.jsx';
import History from '../pages/app/History.jsx';
import Bookmarks from '../pages/app/Bookmarks.jsx';
import Profile from '../pages/app/Profile.jsx';
import Settings from '../pages/app/Settings.jsx';

import AdminHome from '../pages/admin/AdminHome.jsx';
import Users from '../pages/admin/Users.jsx';
import Roles from '../pages/admin/Roles.jsx';
import AuditLogs from '../pages/admin/AuditLogs.jsx';
import Analytics from '../pages/admin/Analytics.jsx';

import NotFound from '../pages/NotFound.jsx';

const ADMIN_PERMS = [
  'admin.users.read',
  'admin.roles.read',
  'admin.audit.read',
  'admin.analytics.read',
];

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Guests AND users: the summarizer itself is open; guests get 3/session via express-session */}
      <Route element={<AppLayout />}>
        <Route path="/summarize" element={<Summarize />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route
        element={
          <PermissionRoute anyOf={ADMIN_PERMS}>
            <AdminLayout />
          </PermissionRoute>
        }
      >
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/roles" element={<Roles />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} />
        <Route path="/admin/analytics" element={<Analytics />} />
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
