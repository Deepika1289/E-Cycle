import { Router } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/profile', authenticate, async (req: any, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('preferences.favoriteStations', 'name location');

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/profile', authenticate, async (req: any, res, next) => {
  try {
    const allowedUpdates = ['name', 'phone', 'avatar', 'preferences'];
    const updates: any = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('preferences.favoriteStations', 'name location');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/users/wallet/topup:
 *   post:
 *     summary: Top up wallet
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post('/wallet/topup', authenticate, async (req: any, res, next) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount < 10 || amount > 10000) {
      return res.status(400).json({ 
        message: 'Invalid amount. Must be between ₹10 and ₹10,000' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { walletBalance: amount } },
      { new: true }
    );

    res.json({
      message: `Wallet topped up with ₹${amount}`,
      newBalance: user!.walletBalance
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/users:  *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { role, limit = 20, page = 1 } = req.query;
    
    let query: any = {};
    if (role) query.role = role;

    const limitNum = typeof limit === 'string' ? parseInt(limit) : 20;
    const pageNum = typeof page === 'string' ? parseInt(page) : 1;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const allowedUpdates = ['name', 'email', 'phone', 'role', 'walletBalance'];
    const updates: any = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/users/{id}/suspend:
 *   patch:
 *     summary: Suspend or activate user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/suspend', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const { status } = req.body; // 'ACTIVE' or 'SUSPENDED'

    if (!status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be ACTIVE or SUSPENDED' 
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User ${status === 'SUSPENDED' ? 'suspended' : 'activated'} successfully`,
      user
    });
  } catch (error) {
    return next(error);
  }
});

export { router as userRoutes };