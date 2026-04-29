import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { Cycle } from '../models/Cycle.js';
import { authenticate } from '../middleware/auth.js';
import { io } from '../server.js';

const router = Router();

const createBookingSchema = z.object({
  cycleId: z.string().min(1, 'Cycle ID is required'),
  startStationId: z.string().min(1, 'Start station ID is required'),
  endStationId: z.string().min(1, 'End station ID is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute')
}).refine((data) => {
  // Validate that we can parse the dates
  try {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start;
  } catch {
    return false;
  }
}, {
  message: 'End time must be after start time and both must be valid dates',
  path: ['endTime']
});
// Removed validation that required start and end stations to be different
// This allows using the same station for parking

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get user bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, async (req: any, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    
    let query: any = { user: req.user._id };
    
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('cycle', 'code model location status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        total,
        pages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, async (req: any, res, next) => {
  try {
    const validatedData = createBookingSchema.parse(req.body);
    
    // Validate that station IDs are valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(validatedData.startStationId) || 
        !mongoose.Types.ObjectId.isValid(validatedData.endStationId)) {
      return res.status(400).json({ 
        message: 'Invalid station IDs provided. Please select valid stations.' 
      });
    }

    // Check if cycle exists and is available
    const cycle = await Cycle.findById(validatedData.cycleId);
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }

    if (cycle.status !== 'AVAILABLE') {
      return res.status(400).json({ 
        message: 'Cycle is not available for booking',
        currentStatus: cycle.status
      });
    }

    // Check if user has any active bookings
    const activeBooking = await Booking.findOne({
      user: req.user._id,
      status: { $in: ['PENDING', 'CONFIRMED'] }
    });

    if (activeBooking) {
      return res.status(400).json({ 
        message: 'You already have an active booking' 
      });
    }

    // Calculate actual duration based on start and end times
    const start = new Date(validatedData.startTime);
    const end = new Date(validatedData.endTime);
    const actualDuration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));

    // Validate that the provided duration is reasonable (within 5 minutes of actual)
    if (Math.abs(validatedData.duration - actualDuration) > 5) {
      return res.status(400).json({
        message: 'Duration does not match the time difference between start and end times',
        providedDuration: validatedData.duration,
        calculatedDuration: actualDuration
      });
    }

    // Calculate estimated cost (base rate: ₹10 per hour)
    const estimatedCost = 10; // Base cost for booking
    
    const booking = new Booking({
      user: req.user._id,
      cycle: validatedData.cycleId,
      startStation: validatedData.startStationId,
      endStation: validatedData.endStationId,
      startTime: new Date(validatedData.startTime),
      endTime: new Date(validatedData.endTime),
      duration: validatedData.duration,
      estimatedCost
    });

    await booking.save();

    // Update cycle status
    await Cycle.findByIdAndUpdate(validatedData.cycleId, {
      status: 'BOOKED'
    });
    io.emit('cycleStatusChanged', { cycleId: validatedData.cycleId, status: 'BOOKED' });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('cycle', 'code model location status qrCode');

    res.status(201).json({
      message: 'Booking created successfully',
      booking: populatedBooking
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors
      });
    }
    return next(error);
  }
});

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/cancel', authenticate, async (req: any, res, next) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking ID format' });
    }
    
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!booking) {
      return res.status(400).json({ message: 'Booking not found' });
    }

    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({ 
        message: 'Cannot cancel booking in current status',
        currentStatus: booking.status
      });
    }

    // Update booking status
    booking.status = 'CANCELLED';
    await booking.save({ validateBeforeSave: false });

    // Update cycle status back to available
    await Cycle.findByIdAndUpdate(booking.cycle, {
      status: 'AVAILABLE'
    });

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, async (req: any, res, next) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking ID format' });
    }
    
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('cycle', 'code model location status qrCode');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    return next(error);
  }
});

export { router as bookingRoutes };