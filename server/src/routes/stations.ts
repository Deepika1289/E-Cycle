import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Station } from '../models/Station.js';
import { Cycle } from '../models/Cycle.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

const createStationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capacity: z.number().min(1),
  facilities: z.array(z.string()).optional()
});

const updateStationSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  capacity: z.number().min(1).optional(),
  facilities: z.array(z.string()).optional()
});

/**
 * @swagger
 * /api/stations/near:
 *   get:
 *     summary: Find nearest stations by coordinates
 *     tags: [Stations]
 */
router.get('/near', async (req, res, next) => {
  try {
    const schema = z.object({ lat: z.string(), lng: z.string(), maxKm: z.string().optional() });
    const { lat, lng, maxKm } = schema.parse(req.query);
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusKm = maxKm ? parseFloat(maxKm) : 5;
    const radiusInRadians = radiusKm / 6378.1; // Earth radius in km

    const stations = await Station.find({
      status: 'ACTIVE',
      location: {
        $geoWithin: {
          $centerSphere: [[lngNum, latNum], radiusInRadians]
        }
      }
    }).limit(20);

    const withAvailability = await Promise.all(stations.map(async (s) => {
      const available = await Cycle.countDocuments({ station: s._id, status: 'AVAILABLE' });
      return { ...s.toObject(), availableCycles: available };
    }));

    res.json(withAvailability);
  } catch (e) { next(e); }
});

/**
 * @swagger
 * /api/stations:
 *   get:
 *     summary: Get all stations
 *     tags: [Stations]
 *     parameters:
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
 */
router.get('/', async (req, res, next) => {
  try {
    const { lat, lng, radius, limit = 100, page = 1 } = req.query;
    
    let query: any = { status: 'ACTIVE' };
    
    // If location provided, find nearby stations
    if (lat && lng) {
      const latNum = parseFloat(lat as string);
      const lngNum = parseFloat(lng as string);
      const radiusKm = radius ? parseFloat(radius as string) : 5;
      const radiusInRadians = radiusKm / 6378.1; // Earth radius in km

      query.location = {
        $geoWithin: {
          $centerSphere: [[lngNum, latNum], radiusInRadians]
        }
      };
    }

    const stations = await Station.find(query)
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string));

    // Get available cycles count for each station
    const stationsWithCycles = await Promise.all(
      stations.map(async (station) => {
        const availableCycles = await Cycle.countDocuments({
          station: station._id,
          status: 'AVAILABLE'
        });
        
        return {
          ...station.toObject(),
          availableCycles
        };
      })
    );

    const total = await Station.countDocuments(query);

    res.json({
      stations: stationsWithCycles,
      pagination: {
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
        currentPage: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/stations:
 *   post:
 *     summary: Create a new station
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, authorize('MANAGER', 'ADMIN'), async (req, res, next) => {
  try {
    const validatedData = createStationSchema.parse(req.body);
    
    const station = new Station({
      name: validatedData.name,
      location: {
        type: 'Point',
        coordinates: [validatedData.longitude, validatedData.latitude]
      },
      capacity: validatedData.capacity,
      facilities: validatedData.facilities || []
    });

    await station.save();

    res.status(201).json({
      message: 'Station created successfully',
      station
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
 * /api/stations/{id}:
 *   get:
 *     summary: Get station by ID
 *     tags: [Stations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', async (req, res, next) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid station ID format' });
    }
    
    const station = await Station.findById(req.params.id);
    
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }

    const cycles = await Cycle.find({ station: station._id });
    const availableCycles = cycles.filter(cycle => cycle.status === 'AVAILABLE');

    res.json({
      ...station.toObject(),
      cycles: cycles.length,
      availableCycles: availableCycles.length,
      cycleDetails: cycles
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/stations/{id}:
 *   put:
 *     summary: Update station by ID
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/:id', authenticate, authorize('MANAGER', 'ADMIN'), async (req, res, next) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid station ID format' });
    }
    
    const validatedData = updateStationSchema.parse(req.body);
    
    const updateData: any = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.capacity) updateData.capacity = validatedData.capacity;
    if (validatedData.facilities) updateData.facilities = validatedData.facilities;
    
    if (validatedData.latitude && validatedData.longitude) {
      updateData.location = {
        type: 'Point',
        coordinates: [validatedData.longitude, validatedData.latitude]
      };
    }

    const station = await Station.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }

    res.json({
      message: 'Station updated successfully',
      station
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
 * /api/stations/{id}:
 *   delete:
 *     summary: Delete station by ID
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid station ID format' });
    }
    
    const station = await Station.findById(req.params.id);
    
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }

    // Check if station has cycles
    const cyclesCount = await Cycle.countDocuments({ station: station._id });
    if (cyclesCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete station with cycles. Please move or delete cycles first.' 
      });
    }

    await Station.findByIdAndDelete(req.params.id);

    res.json({ message: 'Station deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

export { router as stationRoutes };