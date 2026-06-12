import { Router } from 'express';
import { z } from 'zod';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { authenticate } from '../middleware/auth.js';
import QRCode from 'qrcode';
import type Stripe from 'stripe';
import mongoose from 'mongoose';

const router = Router();

const stripeKey = process.env.STRIPE_SECRET_KEY || '';
let stripe: Stripe | null = null;
async function getStripe(): Promise<Stripe | null> {
  if (!stripeKey) return null;
  if (!stripe) {
    const mod = await import('stripe');
    const StripeCtor = (mod as any).default as typeof Stripe;
    stripe = new StripeCtor(stripeKey, { apiVersion: '2024-06-20' });
  }
  return stripe;
}

const createPaymentSchema = z.object({
  type: z.enum(['RIDE', 'WALLET_TOPUP', 'REFUND']),
  method: z.enum(['CARD', 'UPI', 'WALLET']),
  amount: z.number().min(1, 'Amount must be at least ₹1'),
  bookingId: z.string().optional()
});

/**
 * Create Stripe PaymentIntent (card)
 */
router.post('/create-intent', authenticate, async (req: any, res, next) => {
  try {
    const stripeClient = await getStripe();
    if (!stripeClient) return res.status(400).json({ message: 'Stripe not configured' });
    const schema = z.object({ amount: z.number().min(1), currency: z.string().default('inr'), bookingId: z.string().optional() });
    const { amount, currency, bookingId } = schema.parse(req.body);

    if (bookingId) {
      const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
      if (!booking) return res.status(404).json({ message: 'Booking not found' });
    }

    const intent = await stripeClient.paymentIntents.create({
      amount,
      currency,
      metadata: { userId: req.user._id.toString(), bookingId: bookingId || '' }
    });

    // Record pending payment
    await Payment.create({
      user: req.user._id,
      booking: bookingId,
      type: bookingId ? 'RIDE' : 'WALLET_TOPUP',
      method: 'CARD',
      amount,
      status: 'PENDING',
      transactionId: intent.id
    });

    res.json({ clientSecret: intent.client_secret });
  } catch (error) {
    return next(error);
  }
});

/**
 * Stripe webhook to confirm/rollback
 */
router.post('/webhook', async (req: any, res) => {
  try {
    const stripeClient = await getStripe();
    if (!stripeClient) { res.status(400).send('Stripe not configured'); return; }
    const sig = req.headers['stripe-signature'] as string;
    let event: any;

    try {
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
      event = (stripeClient as any).webhooks.constructEvent(req.rawBody || req.body, sig, endpointSecret);
    } catch (err: any) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as any;
      const transactionId = intent.id;
      const metadata = intent.metadata || {} as any;
      const session = await mongoose.startSession();
      await session.withTransaction(async () => {
        const payment = await Payment.findOne({ transactionId }).session(session);
        if (!payment) return;
        payment.status = 'COMPLETED';
        payment.gatewayResponse = intent;
        await payment.save({ session });

        if (metadata.bookingId) {
          await Booking.findByIdAndUpdate(metadata.bookingId, { paymentStatus: 'PAID', status: 'CONFIRMED' }).session(session);
        } else {
          await User.findByIdAndUpdate(metadata.userId, { $inc: { walletBalance: payment.amount } }).session(session);
        }
      });
      session.endSession();
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const transactionId = intent.id;
      const metadata = intent.metadata || {} as any;
      const payment = await Payment.findOne({ transactionId });
      if (payment) {
        payment.status = 'FAILED';
        payment.gatewayResponse = intent;
        await payment.save();
        // rollback booking (ensure not confirmed)
        if (metadata.bookingId) {
          await Booking.findByIdAndUpdate(metadata.bookingId, { paymentStatus: 'FAILED', status: 'CANCELLED' });
        }
      }
    }

    res.json({ received: true });
  } catch (e) {
    res.status(500).send('Webhook handler error');
  }
});

/**
 * Existing endpoints
 */
/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get user payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, CANCELLED]
 *         description: Filter by payment status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [RIDE, WALLET_TOPUP, REFUND]
 *         description: Filter by payment type
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
 *         description: List of payments
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Server error
 */
router.get('/', authenticate, async (req: any, res, next) => {
  try {
    const { status, type, limit = 20, page = 1 } = req.query;
    let query: any = { user: req.user._id };
    if (status) query.status = status;
    if (type) query.type = type;
    const payments = await Payment.find(query)
      .populate('booking', 'cycle estimatedCost')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    const total = await Payment.countDocuments(query);
    res.json({ payments, pagination: { total, pages: Math.ceil(total / parseInt(limit)), currentPage: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create a new payment
 *     tags: [Payments]
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
 *                 enum: [RIDE, WALLET_TOPUP, REFUND]
 *                 example: "WALLET_TOPUP"
 *               method:
 *                 type: string
 *                 enum: [CARD, UPI, WALLET]
 *                 example: "WALLET"
 *               amount:
 *                 type: number
 *                 example: 100
 *               bookingId:
 *                 type: string
 *                 example: "60a8f3c8e8b3a42d8c123456"
 *     responses:
 *       '201':
 *         description: Payment created successfully
 *       '400':
 *         description: Validation error or insufficient wallet balance
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Booking not found
 *       '500':
 *         description: Server error
 */
router.post('/', authenticate, async (req: any, res, next) => {
  try {
    const validatedData = createPaymentSchema.parse(req.body);
    if (validatedData.bookingId) {
      const booking = await Booking.findOne({ _id: validatedData.bookingId, user: req.user._id });
      if (!booking) return res.status(404).json({ message: 'Booking not found' });
    }
    if (validatedData.method === 'WALLET') {
      const user = await User.findById(req.user._id);
      if (user!.walletBalance < validatedData.amount) {
        return res.status(400).json({ message: 'Insufficient wallet balance', currentBalance: user!.walletBalance, required: validatedData.amount });
      }
    }
    const payment = new Payment({
      user: req.user._id,
      booking: validatedData.bookingId,
      type: validatedData.type,
      method: validatedData.method,
      amount: validatedData.amount,
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    if (validatedData.method === 'UPI') {
      const upiString = `upi://pay?pa=9381585747@ybl&pn=EcoRide+&am=${validatedData.amount}&cu=INR&tn=Payment for ${validatedData.type}`;
      payment.qrCode = await QRCode.toDataURL(upiString);
    }
    await payment.save();
    if (validatedData.method === 'WALLET') {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { walletBalance: validatedData.type === 'WALLET_TOPUP' ? validatedData.amount : -validatedData.amount }
      });
      payment.status = 'COMPLETED';
      await payment.save();
      if (validatedData.bookingId) {
        await Booking.findByIdAndUpdate(validatedData.bookingId, { paymentStatus: 'PAID', status: 'CONFIRMED' });
      }
    }
    res.status(201).json({ message: 'Payment created successfully', payment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    return next(error);
  }
});

/**
 * @swagger
 * /api/payments/create-intent:
 *   post:
 *     summary: Create Stripe PaymentIntent
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100
 *               currency:
 *                 type: string
 *                 example: "inr"
 *               bookingId:
 *                 type: string
 *                 example: "60a8f3c8e8b3a42d8c123456"
 *     responses:
 *       '200':
 *         description: Payment intent created
 *       '400':
 *         description: Stripe not configured
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Booking not found
 *       '500':
 *         description: Server error
 */
router.post('/create-intent', authenticate, async (req: any, res, next) => {
  try {
    const stripeClient = await getStripe();
    if (!stripeClient) return res.status(400).json({ message: 'Stripe not configured' });
    const schema = z.object({ amount: z.number().min(1), currency: z.string().default('inr'), bookingId: z.string().optional() });
    const { amount, currency, bookingId } = schema.parse(req.body);

    if (bookingId) {
      const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
      if (!booking) return res.status(404).json({ message: 'Booking not found' });
    }

    const intent = await stripeClient.paymentIntents.create({
      amount,
      currency,
      metadata: { userId: req.user._id.toString(), bookingId: bookingId || '' }
    });

    // Record pending payment
    await Payment.create({
      user: req.user._id,
      booking: bookingId,
      type: bookingId ? 'RIDE' : 'WALLET_TOPUP',
      method: 'CARD',
      amount,
      status: 'PENDING',
      transactionId: intent.id
    });

    res.json({ clientSecret: intent.client_secret });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/payments/{id}/confirm:
 *   post:
 *     summary: Confirm a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       '200':
 *         description: Payment confirmed successfully
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Pending payment not found
 *       '500':
 *         description: Server error
 */
router.post('/:id/confirm', authenticate, async (req: any, res, next) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, user: req.user._id, status: 'PENDING' });
    if (!payment) return res.status(404).json({ message: 'Pending payment not found' });

    // Simulated payment — always succeeds (no real gateway)
    payment.status = 'COMPLETED';
    payment.gatewayResponse = {
      status: 'SUCCESS',
      timestamp: new Date(),
      gatewayTransactionId: `SIM_${Date.now()}`
    };

    if (payment.type === 'WALLET_TOPUP') {
      await User.findByIdAndUpdate(req.user._id, { $inc: { walletBalance: payment.amount } });
    }
    if (payment.booking) {
      await Booking.findByIdAndUpdate(payment.booking, {
        paymentStatus: 'PAID',
        status: 'CONFIRMED'
      });
    }

    await payment.save();
    res.json({ message: 'Payment completed successfully', payment });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       '200':
 *         description: Payment details
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Payment not found
 *       '500':
 *         description: Server error
 */
router.get('/:id', authenticate, async (req: any, res, next) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid payment ID format' });
    }
    
    const payment = await Payment.findOne({ _id: req.params.id, user: req.user._id }).populate('booking', 'cycle estimatedCost');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    return next(error);
  }
});

export { router as paymentRoutes };