import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import rolesRoutes from '../modules/roles/roles.routes.js';
import summariesRoutes from '../modules/summaries/summaries.routes.js';
import bookmarksRoutes from '../modules/bookmarks/bookmarks.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import analyticsRoutes from '../modules/analytics/analytics.routes.js';
import auditRoutes from '../modules/audit/audit.routes.js';
import notificationsRoutes from '../modules/notifications/notifications.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/roles', rolesRoutes);
router.use('/summaries', summariesRoutes);
router.use('/bookmarks', bookmarksRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/dashboard', dashboardRoutes);

// Modules will be mounted here in later phases:
// router.use('/users', userRoutes);
// router.use('/summaries', summaryRoutes);
// router.use('/bookmarks', bookmarkRoutes);
// router.use('/roles', roleRoutes);
// router.use('/analytics', analyticsRoutes);
// router.use('/audit-logs', auditLogRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/dashboard', dashboardRoutes);

router.get('/', (_req, res) => {
  res.json({ success: true, data: { name: 'AI Summarizer API', version: 'v1' } });
});

export default router;
