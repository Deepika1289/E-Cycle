import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Issue } from '../models/Issue.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

const createIssueSchema = z.object({
  type: z.enum(['CYCLE_DAMAGE', 'PAYMENT_ISSUE', 'APP_BUG', 'STATION_ISSUE', 'OTHER']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  cycleId: z.string().optional(),
  stationId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional()
});

/**
 * @swagger
 * /api/issues:
 *   get:
 *     summary: Get issues
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED]
 *         description: Filter by issue status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CYCLE_DAMAGE, PAYMENT_ISSUE, APP_BUG, STATION_ISSUE, OTHER]
 *         description: Filter by issue type
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *         description: Filter by issue priority
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
 *         description: List of issues
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Server error
 */
router.get('/', authenticate, async (req: any, res, next) => {
  try {
    const { status, type, priority, limit = 20, page = 1 } = req.query;
    
    let query: any = {};
    
    // Users can only see their own issues, managers/admins can see all
    if (req.user.role === 'USER') {
      query.user = req.user._id;
    }
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const issues = await Issue.find(query)
      .populate('user', 'name email')
      .populate('cycle', 'code model')
      .populate('station', 'name')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Issue.countDocuments(query);

    res.json({
      issues,
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
 * /api/issues:
 *   post:
 *     summary: Create a new issue
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [CYCLE_DAMAGE, PAYMENT_ISSUE, APP_BUG, STATION_ISSUE, OTHER]
 *                 example: "CYCLE_DAMAGE"
 *               title:
 *                 type: string
 *                 example: "Broken chain"
 *               description:
 *                 type: string
 *                 example: "The chain on cycle CYC001 is broken and needs repair"
 *               cycleId:
 *                 type: string
 *                 example: "60a8f3c8e8b3a42d8c123456"
 *               stationId:
 *                 type: string
 *                 example: "60a8f3c8e8b3a42d8c123457"
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 example: "HIGH"
 *     responses:
 *       '201':
 *         description: Issue created successfully
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Server error
 */
router.post('/', authenticate, async (req: any, res, next) => {
  try {
    const validatedData = createIssueSchema.parse(req.body);
    
    const issue = new Issue({
      user: req.user._id,
      cycle: validatedData.cycleId,
      station: validatedData.stationId,
      type: validatedData.type,
      title: validatedData.title,
      description: validatedData.description,
      priority: validatedData.priority || 'MEDIUM'
    });

    await issue.save();

    const populatedIssue = await Issue.findById(issue._id)
      .populate('user', 'name email')
      .populate('cycle', 'code model')
      .populate('station', 'name');

    res.status(201).json({
      message: 'Issue reported successfully',
      issue: populatedIssue
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
 * /api/issues/{id}:
 *   get:
 *     summary: Get issue by ID
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Issue ID
 *     responses:
 *       '200':
 *         description: Issue details
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Issue not found
 *       '500':
 *         description: Server error
 */
router.get('/:id', authenticate, async (req: any, res, next) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid issue ID format' });
    }
    
    let query: any = { _id: req.params.id };
    
    // Users can only see their own issues
    if (req.user.role === 'USER') {
      query.user = req.user._id;
    }

    const issue = await Issue.findOne(query)
      .populate('user', 'name email')
      .populate('cycle', 'code model location')
      .populate('station', 'name location')
      .populate('assignedTo', 'name email');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.json(issue);
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/issues/{id}/assign:
 *   patch:
 *     summary: Assign issue to user (MANAGER or ADMIN only)
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Issue ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assignedTo:
 *                 type: string
 *                 example: "60a8f3c8e8b3a42d8c123458"
 *     responses:
 *       '200':
 *         description: Issue assigned successfully
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Issue not found
 *       '500':
 *         description: Server error
 */
router.patch('/:id/assign', authenticate, authorize('MANAGER', 'ADMIN'), async (req: any, res, next) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid issue ID format' });
    }
    
    const { assignedTo } = req.body;
    
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { 
        assignedTo: assignedTo || req.user._id,
        status: 'IN_PROGRESS'
      },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.json({
      message: 'Issue assigned successfully',
      issue
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/issues/{id}/resolve:
 *   patch:
 *     summary: Resolve issue (MANAGER or ADMIN only)
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Issue ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resolution:
 *                 type: string
 *                 example: "Issue has been fixed and cycle is now working properly"
 *     responses:
 *       '200':
 *         description: Issue resolved successfully
 *       '400':
 *         description: Resolution is required
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Issue not found
 *       '500':
 *         description: Server error
 */
router.patch('/:id/resolve', authenticate, authorize('MANAGER', 'ADMIN'), async (req: any, res, next) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid issue ID format' });
    }
    
    const { resolution } = req.body;
    
    if (!resolution) {
      return res.status(400).json({ message: 'Resolution is required' });
    }

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'RESOLVED',
        resolution,
        assignedTo: req.user._id
      },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.json({
      message: 'Issue resolved successfully',
      issue
    });
  } catch (error) {
    return next(error);
  }
});

export { router as issueRoutes };