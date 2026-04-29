import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { Ride } from '../models/Ride.js';

const router = Router();

/**
 * @swagger
 * /api/analytics/heatmap:
 *   get:
 *     summary: Get ride heatmap data (ADMIN only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to include in heatmap
 *     responses:
 *       '200':
 *         description: Heatmap data
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '500':
 *         description: Server error
 */
router.get('/heatmap', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const days = parseInt((req.query.days as string) || '7');
    const since = new Date(Date.now() - days * 86400000);
    const agg = await Ride.aggregate([
      { $match: { startTime: { $gte: since } } },
      { $project: { loc: '$startLocation' } },
      { $match: { 'loc.coordinates': { $type: 'array' } } },
      { $group: { _id: { $concat: [ { $toString: { $arrayElemAt: ['$loc.coordinates', 0] } }, ',', { $toString: { $arrayElemAt: ['$loc.coordinates', 1] } } ] }, count: { $sum: 1 }, loc: { $first: '$loc' } } }
    ]);
    res.json(agg.map(a => ({ lat: a.loc.coordinates[1], lng: a.loc.coordinates[0], count: a.count })));
  } catch (e) { next(e); }
});

/**
 * @swagger
 * /api/analytics/usage:
 *   get:
 *     summary: Get usage statistics (ADMIN only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to include in statistics
 *     responses:
 *       '200':
 *         description: Usage statistics
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '500':
 *         description: Server error
 */
router.get('/usage', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const days = parseInt((req.query.days as string) || '30');
    const since = new Date(Date.now() - days * 86400000);
    const agg = await Ride.aggregate([
      { $match: { startTime: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } }, rides: { $sum: 1 }, distance: { $sum: '$distance' }, duration: { $sum: '$duration' } } },
      { $sort: { _id: 1 } }
    ]);
    res.json(agg.map(d => ({ date: d._id, rides: d.rides, distance: d.distance, duration: d.duration })));
  } catch (e) { next(e); }
});

export { router as analyticsRoutes };
