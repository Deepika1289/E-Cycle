import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { io } from '../server.js';
import { startRideSchema, updateLocationSchema } from '../validators/ride.js';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Ride } from '../models/Ride.js';
import { Booking } from '../models/Booking.js';
import { Cycle } from '../models/Cycle.js';
import { User } from '../models/User.js';
import { cancelRide, cancelRideByUser, getAllActiveRides, scheduleAutoEndRide } from '../controllers/rides.js';

const router = Router();

/**
 * @swagger
 * /api/rides:
 *   get:
 *     summary: Get user rides
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, COMPLETED, CANCELLED]
 *         description: Filter by ride status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       '200':
 *         description: List of rides
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Server error
 */
router.get('/', authenticate, async (req: any, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    
    let query: any = { user: req.user._id };
    
    if (status) {
      query.status = status;
    }

    const rides = await Ride.find(query)
      .populate('cycle', 'code model')
      .populate('booking', 'estimatedCost')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Ride.countDocuments(query);

    res.json({
      rides,
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
 * /api/rides/start:
 *   post:
 *     summary: Start a ride
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingId:
 *                 type: string
 *                 example: "60a8f3c8e8b3a42d8c123456"
 *               latitude:
 *                 type: number
 *                 example: 12.9716
 *               longitude:
 *                 type: number
 *                 example: 77.5946
 *     responses:
 *       '201':
 *         description: Ride started successfully
 *       '400':
 *         description: Validation error or ride already started
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Booking not found
 *       '500':
 *         description: Server error
 */
router.post('/start', authenticate, async (req: any, res, next) => {
  try {
    const validatedData = startRideSchema.parse(req.body);
    
    // Check if booking exists and belongs to user
    const booking = await Booking.findOne({
      _id: validatedData.bookingId,
      user: req.user._id,
      status: 'CONFIRMED'
    });

    if (!booking) {
      return res.status(404).json({ 
        message: 'Valid confirmed booking not found' 
      });
    }

    // Check if ride already started for this booking
    const existingRide = await Ride.findOne({ booking: booking._id });
    if (existingRide) {
      return res.status(400).json({ 
        message: 'Ride already started for this booking' 
      });
    }

    const ride = new Ride({
      booking: booking._id,
      user: req.user._id,
      cycle: booking.cycle,
      startLocation: {
        type: 'Point',
        coordinates: [validatedData.longitude, validatedData.latitude]
      },
      startTime: new Date(),
      route: [{
        location: {
          type: 'Point',
          coordinates: [validatedData.longitude, validatedData.latitude]
        },
        timestamp: new Date()
      }]
    });

    await ride.save();

    // Update cycle and booking status
    await Promise.all([
      Cycle.findByIdAndUpdate(booking.cycle, { status: 'IN_USE' }),
      Booking.findByIdAndUpdate(booking._id, { status: 'COMPLETED' })
    ]);

    const populatedRide = await Ride.findById(ride._id)
      .populate('cycle', 'code model')
      .populate('booking', 'estimatedCost');

    // Emit real-time update
    io.emit('rideStarted', {
      rideId: ride._id,
      userId: req.user._id,
      cycleId: booking.cycle
    });

    res.status(201).json({
      message: 'Ride started successfully',
      ride: populatedRide
    });
  } catch (error: unknown) {
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
 * /api/rides/{id}/location:
 *   post:
 *     summary: Update ride location
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ride ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 12.9716
 *               longitude:
 *                 type: number
 *                 example: 77.5946
 *     responses:
 *       '200':
 *         description: Location updated successfully
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Active ride not found
 *       '500':
 *         description: Server error
 */
router.post('/:id/location', authenticate, async (req: any, res, next) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ride ID format' });
    }
    
    const validatedData = updateLocationSchema.parse(req.body);
    
    const ride = await Ride.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'ACTIVE'
    });

    if (!ride) {
      return res.status(404).json({ message: 'Active ride not found' });
    }

    // Add new location to route
    ride.route.push({
      location: {
        type: 'Point',
        coordinates: [validatedData.longitude, validatedData.latitude]
      },
      timestamp: new Date()
    });

    // Calculate distance (simplified calculation)
    if (ride.route.length > 1) {
      const lastPoint = ride.route[ride.route.length - 2];
      const currentPoint = ride.route[ride.route.length - 1];
      
      // Simple distance calculation (in km)
      const deltaLat = currentPoint.location.coordinates[1] - lastPoint.location.coordinates[1];
      const deltaLng = currentPoint.location.coordinates[0] - lastPoint.location.coordinates[0];
      const segmentDistance = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng) * 111; // Rough km conversion
      
      ride.distance += segmentDistance;
    }

    await ride.save();

    // Update cycle location
    await Cycle.findByIdAndUpdate(ride.cycle, {
      location: {
        type: 'Point',
        coordinates: [validatedData.longitude, validatedData.latitude]
      }
    });

    // Emit real-time location update
    io.emit('locationUpdate', {
      rideId: ride._id,
      location: {
        latitude: validatedData.latitude,
        longitude: validatedData.longitude
      },
      distance: ride.distance
    });

    res.json({
      message: 'Location updated successfully',
      distance: ride.distance,
      duration: Math.floor((Date.now() - ride.startTime.getTime()) / 1000)
    });
  } catch (error: unknown) {
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
 * /api/rides/{id}/end:
 *   post:
 *     summary: End a ride
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ride ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 12.9716
 *               longitude:
 *                 type: number
 *                 example: 77.5946
 *     responses:
 *       '200':
 *         description: Ride ended successfully
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Active ride not found
 *       '500':
 *         description: Server error
 */
router.post('/:id/end', authenticate, async (req: any, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ride ID format' });
    }
    
    const ride = await Ride.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'ACTIVE'
    });

    if (!ride) {
      return res.status(404).json({ message: 'Active ride not found' });
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - ride.startTime.getTime()) / 1000); // in seconds

    // Calculate cost: ₹2 per minute + ₹0.5 per 100m
    const timeCost = (duration / 60) * 2;
    const distanceCost = (ride.distance * 1000 / 100) * 0.5;
    const totalCost = Math.max(timeCost + distanceCost, 10); // Minimum ₹10

    // Update ride
    ride.endTime = endTime;
    ride.endLocation = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    ride.duration = duration;
    ride.cost = totalCost;
    ride.status = 'COMPLETED';

    await ride.save();

    // Update cycle status and location
    await Cycle.findByIdAndUpdate(ride.cycle, {
      status: 'AVAILABLE',
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      $inc: { totalRides: 1, totalDistance: ride.distance }
    });

    // Deduct cost from user wallet
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { walletBalance: -totalCost }
    });

    const populatedRide = await Ride.findById(ride._id)
      .populate('cycle', 'code model')
      .populate('booking', 'estimatedCost');

    // Emit real-time update
    io.emit('rideEnded', {
      rideId: ride._id,
      userId: req.user._id,
      cost: totalCost,
      distance: ride.distance,
      duration: duration
    });

    res.json({
      message: 'Ride ended successfully',
      ride: populatedRide,
      summary: {
        distance: ride.distance,
        duration: duration,
        cost: totalCost
      }
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/rides/{id}:
 *   get:
 *     summary: Get ride by ID
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ride ID
 *     responses:
 *       '200':
 *         description: Ride details
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Ride not found
 *       '500':
 *         description: Server error
 */
router.get('/:id', authenticate, async (req: any, res, next) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ride ID format' });
    }
    
    const ride = await Ride.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    .populate('cycle', 'code model')
    .populate('booking', 'estimatedCost');

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    res.json(ride);
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/rides/manager/active:
 *   get:
 *     summary: Get all active rides (Manager only)
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 */
router.get('/manager/active', authenticate, authorize('MANAGER', 'ADMIN'), getAllActiveRides);

/**
 * @swagger
 * /api/rides/cancel:
 *   post:
 *     summary: Cancel a ride (Manager only)
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rideId:
 *                 type: string
 *               reason:
 *                 type: string
 */
router.post('/cancel', authenticate, authorize('MANAGER', 'ADMIN'), cancelRide);

// Allow users to cancel their own active ride with a reason
router.post('/:id/cancel', authenticate, cancelRideByUser);

// Schedule automatic ride ending
router.post('/schedule-end', authenticate, scheduleAutoEndRide);

export { router as rideRoutes };
