import { Router } from 'express';
import { z } from 'zod';
import { Cycle } from '../models/Cycle.js';
import { Booking } from '../models/Booking.js';
import { authenticate } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import { startRideFromBooking } from '../services/rideService.js';

const router = Router();

const unlockQRSchema = z.object({
  qrCode: z.string().min(1, 'QR code is required')
});

/**
 * @swagger
 * /api/qr/unlock:
 *   post:
 *     summary: Unlock cycle via QR code
 *     tags: [QR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qrCode:
 *                 type: string
 *                 example: "CYCLE_CYC001_1234567890"
 *     responses:
 *       '200':
 *         description: QR code verified successfully
 *       '400':
 *         description: Validation error
 *       '403':
 *         description: No confirmed booking for this cycle
 *       '404':
 *         description: Invalid QR code - cycle not found
 *       '500':
 *         description: Server error
 */
router.post('/unlock', authenticate, async (req: any, res, next) => {
  try {
    const validatedData = unlockQRSchema.parse(req.body);
    const cycle = await Cycle.findOne({ qrCode: validatedData.qrCode });
    if (!cycle) {
      return res.status(404).json({ message: 'Invalid QR code - cycle not found' });
    }

    const booking = await Booking.findOne({
      cycle: cycle._id,
      user: req.user._id,
      status: 'CONFIRMED'
    });
    if (!booking) {
      return res.status(403).json({ message: 'You do not have a confirmed booking for this cycle' });
    }

    // create short-lived unlock JWT (1 min)
    const unlockToken = jwt.sign(
      { sub: req.user._id.toString(), cycleId: cycle._id.toString(), bookingId: booking._id.toString() },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '60s' }
    );

    res.json({
      message: 'QR code verified successfully',
      unlockToken,
      cycle: { id: cycle._id, code: cycle.code, model: cycle.cycleModel, batteryLevel: cycle.batteryLevel },
      booking: { id: booking._id, startTime: booking.startTime, estimatedCost: booking.estimatedCost }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    return next(error);
  }
});

/**
 * @swagger
 * /api/qr/confirm-unlock:
 *   post:
 *     summary: Confirm physical unlock using short token and start ride
 *     tags: [QR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       '200':
 *         description: Ride started successfully
 *       '400':
 *         description: Validation error
 *       '403':
 *         description: Forbidden
 *       '500':
 *         description: Server error
 */
router.post('/confirm-unlock', authenticate, async (req: any, res, next) => {
  try {
    const schema = z.object({ token: z.string().min(1) });
    const { token } = schema.parse(req.body);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    if (decoded.sub !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });

    // Start ride transactionally
    const ride = await startRideFromBooking(decoded.bookingId, req.user._id.toString());
    return res.json({ message: 'Ride started', ride });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    return next(error);
  }
});

/**
 * @swagger
 * /api/qr/verify/{cycleId}:
 *   get:
 *     summary: Verify QR code for a specific cycle
 *     tags: [QR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cycleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cycle ID
 *     responses:
 *       '200':
 *         description: Cycle verification details
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Cycle not found
 *       '500':
 *         description: Server error
 */
router.get('/verify/:cycleId', authenticate, async (req: any, res, next) => {
  try {
    const cycle = await Cycle.findById(req.params.cycleId);
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }

    const booking = await Booking.findOne({
      cycle: cycle._id,
      user: req.user._id,
      status: { $in: ['CONFIRMED', 'PENDING'] }
    });

    res.json({
      cycle: { id: cycle._id, code: cycle.code, model: cycle.cycleModel, status: cycle.status, batteryLevel: cycle.batteryLevel },
      hasBooking: !!booking,
      booking: booking ? { id: booking._id, status: booking.status, paymentStatus: booking.paymentStatus } : null
    });
  } catch (error) {
    return next(error);
  }
});

export { router as qrRoutes };