import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { authenticate, authorize } from '../middleware/auth.js';
import { Cycle } from '../models/Cycle.js';
import { Station } from '../models/Station.js';

const router = Router();

const createCycleSchema = z.object({
  code: z.string().min(1),
  model: z.string().min(1), // API uses 'model', mapped to 'cycleModel' in DB
  latitude: z.number(),
  longitude: z.number(),
  stationId: z.string().optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  imageUrl: z.string().optional()
});

const updateCycleSchema = z.object({
  code: z.string().min(1).optional(),
  model: z.string().min(1).optional(), // API uses 'model', mapped to 'cycleModel' in DB
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  stationId: z.string().optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  imageUrl: z.string().optional(),
  status: z.enum(['AVAILABLE', 'BOOKED', 'IN_USE', 'MAINTENANCE', 'INACTIVE']).optional()
});

/**
 * @swagger
 * /api/cycles:
 *   post:
 *     summary: Create a new cycle (MANAGER or ADMIN only)
 *     tags: [Cycles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "CYC001"
 *               cycleModel:
 *                 type: string
 *                 example: "Mountain Bike"
 *               latitude:
 *                 type: number
 *                 example: 12.9716
 *               longitude:
 *                 type: number
 *                 example: 77.5946
 *               stationId:
 *                 type: string
 *                 example: "60a8f3c8e8b3a42d8c123456"
 *               batteryLevel:
 *                 type: number
 *                 example: 85
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/cycle.jpg"
 *     responses:
 *       '201':
 *         description: Cycle created successfully
 *       '400':
 *         description: Validation error or cycle code already exists
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '500':
 *         description: Server error
 */
// Create a new cycle (MANAGER or ADMIN)
router.post('/', authenticate, authorize('MANAGER', 'ADMIN'), async (req, res, next) => {
  try {
    const validated = createCycleSchema.parse(req.body);

    // Ensure unique code/qrCode
    const existing = await Cycle.findOne({ code: validated.code });
    if (existing) return res.status(400).json({ message: 'Cycle code already exists' });

    const qrCode = `CYCLE_${validated.code}_${Date.now()}`;

    const cycle = new Cycle({
      code: validated.code,
      cycleModel: validated.model, // Map API 'model' to DB 'cycleModel'
      batteryLevel: validated.batteryLevel ?? 100,
      status: 'AVAILABLE',
      location: { type: 'Point', coordinates: [validated.longitude, validated.latitude] },
      station: validated.stationId || null,
      qrCode,
      imageUrl: validated.imageUrl || ''
    } as any);

    await cycle.save();

    // If associated with a station, increment availableCycles
    if (validated.stationId) {
      await Station.findByIdAndUpdate(validated.stationId, { $inc: { availableCycles: 1 } });
    }

    res.status(201).json({ message: 'Cycle created', cycle });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    return next(err);
  }
});

/**
 * @swagger
 * /api/cycles:
 *   get:
 *     summary: Get all cycles
 *     tags: [Cycles]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, BOOKED, IN_USE, MAINTENANCE, INACTIVE]
 *         description: Filter by cycle status
 *       - in: query
 *         name: stationId
 *         schema:
 *           type: string
 *         description: Filter by station ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of results to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       '200':
 *         description: List of cycles
 *       '500':
 *         description: Server error
 */
// Get all cycles
router.get('/', async (req, res, next) => {
  try {
    const { status, stationId, limit = 100, page = 1 } = req.query;
    
    let query: any = {};
    
    if (status) query.status = status;
    if (stationId) query.station = stationId;

    const cycles = await Cycle.find(query)
      .populate('station', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string));

    const total = await Cycle.countDocuments(query);

    res.json({
      cycles,
      pagination: {
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
        currentPage: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * @swagger
 * /api/cycles/nearby:
 *   get:
 *     summary: Get nearby cycles by coordinates
 *     tags: [Cycles]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Latitude for nearby search
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: Longitude for nearby search
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         description: Radius in kilometers for nearby search
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by cycle status
 *     responses:
 *       '200':
 *         description: List of nearby cycles
 *       '500':
 *         description: Server error
 */
router.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lng, radius = 5, status } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const latNum = parseFloat(lat as string);
    const lngNum = parseFloat(lng as string);
    const radiusKm = radius ? parseFloat(radius as string) : 5;
    const radiusInRadians = radiusKm / 6378.1; // Earth radius in km

    let query: any = {
      location: {
        $geoWithin: {
          $centerSphere: [[lngNum, latNum], radiusInRadians]
        }
      }
    };
    
    if (status) query.status = status;

    const cycles = await Cycle.find(query)
      .populate('station', 'name')
      .limit(50);

    res.json(cycles);
  } catch (err) {
    return next(err);
  }
});

/**
 * @swagger
 * /api/cycles/{id}:
 *   get:
 *     summary: Get cycle by ID
 *     tags: [Cycles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cycle ID
 *     responses:
 *       '200':
 *         description: Cycle details
 *       '404':
 *         description: Cycle not found
 *       '500':
 *         description: Server error
 */
// Get cycle by ID
router.get('/:id', async (req, res, next) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid cycle ID format' });
    }
    
    const cycle = await Cycle.findById(req.params.id).populate('station', 'name location');
    
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }

    res.json(cycle);
  } catch (err) {
    return next(err);
  }
});

/**
 * @swagger
 * /api/cycles/{id}:
 *   put:
 *     summary: Update cycle by ID (MANAGER or ADMIN only)
 *     tags: [Cycles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cycle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "CYC001"
 *               cycleModel:
 *                 type: string
 *                 example: "Mountain Bike"
 *               latitude:
 *                 type: number
 *                 example: 12.9716
 *               longitude:
 *                 type: number
 *                 example: 77.5946
 *               stationId:
 *                 type: string
 *                 example: "60a8f3c8e8b3a42d8c123456"
 *               batteryLevel:
 *                 type: number
 *                 example: 85
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/cycle.jpg"
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, BOOKED, IN_USE, MAINTENANCE, INACTIVE]
 *     responses:
 *       '200':
 *         description: Cycle updated successfully
 *       '400':
 *         description: Validation error or cycle code already exists
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Cycle not found
 *       '500':
 *         description: Server error
 */
// Update cycle (MANAGER or ADMIN)
router.put('/:id', authenticate, authorize('MANAGER', 'ADMIN'), async (req, res, next) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid cycle ID format' });
    }
    
    const validated = updateCycleSchema.parse(req.body);
    const cycle = await Cycle.findById(req.params.id);
    
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }

    // Check if code is being changed and if it already exists
    if (validated.code && validated.code !== cycle.code) {
      const existing = await Cycle.findOne({ code: validated.code });
      if (existing) {
        return res.status(400).json({ message: 'Cycle code already exists' });
      }
      cycle.code = validated.code;
    }

    // Update station if changed
    const oldStationId = cycle.station?.toString();
    const newStationId = validated.stationId;
    
    if (validated.model) cycle.set('cycleModel', validated.model); // Map API 'model' to DB 'cycleModel'
    if (validated.batteryLevel !== undefined) cycle.set('batteryLevel', validated.batteryLevel);
    if (validated.status) cycle.set('status', validated.status);
    if (validated.imageUrl !== undefined) cycle.set('imageUrl', validated.imageUrl);
    if (validated.stationId !== undefined) cycle.set('station', validated.stationId || undefined);
    
    if (validated.latitude !== undefined && validated.longitude !== undefined) {
      cycle.location = {
        type: 'Point',
        coordinates: [validated.longitude, validated.latitude]
      };
    }

    await cycle.save();

    // Update station cycle counts if station changed
    if (oldStationId !== newStationId) {
      if (oldStationId) {
        await Station.findByIdAndUpdate(oldStationId, { $inc: { availableCycles: -1 } });
      }
      if (newStationId) {
        await Station.findByIdAndUpdate(newStationId, { $inc: { availableCycles: 1 } });
      }
    }

    const updatedCycle = await Cycle.findById(cycle._id).populate('station', 'name');
    res.json({ message: 'Cycle updated successfully', cycle: updatedCycle });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    return next(err);
  }
});

/**
 * @swagger
 * /api/cycles/{id}/status:
 *   patch:
 *     summary: Update cycle status (MANAGER or ADMIN only)
 *     tags: [Cycles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cycle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, BOOKED, IN_USE, MAINTENANCE, INACTIVE]
 *                 example: "MAINTENANCE"
 *     responses:
 *       '200':
 *         description: Cycle status updated
 *       '400':
 *         description: Invalid status
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Cycle not found
 *       '500':
 *         description: Server error
 */
// Update cycle status (MANAGER or ADMIN)
router.patch('/:id/status', authenticate, authorize('MANAGER', 'ADMIN'), async (req, res, next) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid cycle ID format' });
    }
    
    const { status } = req.body;
    
    if (!['AVAILABLE', 'BOOKED', 'IN_USE', 'MAINTENANCE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const cycle = await Cycle.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('station', 'name');

    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }

    res.json({ message: 'Cycle status updated', cycle });
  } catch (err) {
    return next(err);
  }
});

/**
 * @swagger
 * /api/cycles/{id}:
 *   delete:
 *     summary: Delete cycle (ADMIN only)
 *     tags: [Cycles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cycle ID
 *     responses:
 *       '200':
 *         description: Cycle deleted successfully
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Cycle not found
 *       '500':
 *         description: Server error
 */
// Delete cycle (ADMIN only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid cycle ID format' });
    }
    
    const cycle = await Cycle.findById(req.params.id);
    
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }

    // Decrement station availableCycles if associated
    if (cycle.station) {
      await Station.findByIdAndUpdate(cycle.station, { $inc: { availableCycles: -1 } });
    }

    await Cycle.findByIdAndDelete(req.params.id);

    res.json({ message: 'Cycle deleted successfully' });
  } catch (err) {
    return next(err);
  }
});

export { router as cycleRoutes };