import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';
import { validate } from '../../middlewares/validate.js';
import { requireAuth, requirePermission } from '../../middlewares/auth.js';
import { PERMISSIONS } from '../../config/constants.js';
import * as svc from './analytics.service.js';

const router = Router();
router.use(requireAuth, requirePermission(PERMISSIONS.ADMIN_ANALYTICS_READ));

const daysSchema = z.object({ days: z.coerce.number().int().min(1).max(365).default(30) });

router.get(
  '/overview',
  asyncHandler(async (_req, res) => ok(res, await svc.getOverview())),
);

router.get(
  '/usage',
  validate(daysSchema, 'query'),
  asyncHandler(async (req, res) => ok(res, { series: await svc.getUsageSeries({ days: req.query.days }) })),
);

router.get(
  '/growth',
  validate(daysSchema, 'query'),
  asyncHandler(async (req, res) => ok(res, { series: await svc.getGrowthSeries({ days: req.query.days }) })),
);

router.get(
  '/summary-types',
  validate(daysSchema, 'query'),
  asyncHandler(async (req, res) => ok(res, { breakdown: await svc.getSummaryTypeBreakdown({ days: req.query.days }) })),
);

export default router;
