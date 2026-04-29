import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// In a real implementation, notifications would come from a database
// For now, we'll keep the mock data but structure it to be easily replaceable
const generateMockNotifications = (userId: string) => [
  {
    id: '1',
    title: 'Ride Completed',
    message: 'Your ride on CYC001 has been completed. Total cost: ₹25',
    type: 'RIDE',
    read: false,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    id: '2',
    title: 'Payment Successful',
    message: 'Your wallet has been topped up with ₹500',
    type: 'PAYMENT',
    read: false,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    id: '3',
    title: 'Booking Confirmed',
    message: 'Your booking for CYC003 is confirmed. Scan QR to unlock.',
    type: 'BOOKING',
    read: true,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  },
  {
    id: '4',
    title: 'New Cycle Available',
    message: 'A new cycle is now available at Main Library Station',
    type: 'SYSTEM',
    read: true,
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
  }
];

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Filter to show only unread notifications
 *     responses:
 *       '200':
 *         description: List of notifications
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Server error
 */
router.get('/', authenticate, async (req: any, res, next) => {
  try {
    const { unreadOnly } = req.query;
    
    // In a real implementation, this would fetch notifications from a database
    // For now, we'll return mock data
    let notifications = generateMockNotifications(req.user._id);
    
    if (unreadOnly === 'true') {
      notifications = notifications.filter(n => !n.read);
    }

    res.json({
      notifications,
      unreadCount: notifications.filter(n => !n.read).length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       '200':
 *         description: Notification marked as read
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Server error
 */
router.patch('/:id/read', authenticate, async (req: any, res, next) => {
  try {
    // In a real app, you'd update the notification in database
    res.json({
      message: 'Notification marked as read',
      notificationId: req.params.id
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: All notifications marked as read
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Server error
 */
router.patch('/mark-all-read', authenticate, async (req: any, res, next) => {
  try {
    // In a real app, you'd update all user notifications in database
    res.json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
});

export { router as notificationRoutes };