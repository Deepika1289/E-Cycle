import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

import { User } from '../models/User.js';
import { OtpModel } from '../models/Otp.js';
import { generateNumericOtp, hashOtp, verifyOtpHash } from '../utils/otp.js';
import { sendOtpEmail as sendOtpEmailUtil, sendUsernameEmail } from '../utils/email.js';
import * as redisStore from '../services/otpStoreRedis.js';
import { authenticate } from '../middleware/auth.js';
import { isRoleAssignmentValid } from '../utils/roleValidation.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  role: z.enum(['USER', 'MANAGER', 'ADMIN']).optional().default('USER')
  // Removed password requirement
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

const OTP_EXPIRY_SECONDS = Number(process.env.OTP_EXPIRY_SECONDS || 120); // 2 minutes
const OTP_MAX_VERIFY_ATTEMPTS = Number(process.env.OTP_MAX_VERIFY_ATTEMPTS || 5);

// Rate limiter: max 3 OTP sends per minute per email (keyed by email param)
const sendOtpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.body?.email || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ message: 'Too many OTP requests. Try again later.' })
});

// Login-specific limiter (less strict than global limiter)
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // allow up to 20 login attempts per minute per IP
  keyGenerator: (req) => req.ip || (req.body?.username || ''),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ message: 'Too many login attempts, please try again later.' })
});

// Generate unique username based on role with email format
const generateUsername = async (role: string) => {
  let counter = 1;
  let username = '';
  let exists = true;
  
  // Get last 4 digits from timestamp + random number
  const generateId = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000);
    const combined = timestamp + random.toString().padStart(4, '0');
    return combined.slice(-4);
  };
  
  while (exists) {
    const uniqueId = generateId();
    
    switch(role) {
      case 'USER':
        username = `user${uniqueId}@user.cutm.in`;
        break;
      case 'MANAGER':
        username = `manager${uniqueId}@manager.cutm.in`;
        break;
      case 'ADMIN':
        username = `admin${uniqueId}@admin.cutm.in`;
        break;
      default:
        username = `user${uniqueId}@user.cutm.in`;
    }
    
    const user = await User.findOne({ username });
    if (!user) {
      exists = false;
    }
  }
  
  return username;
};

// Validation middleware helper
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      message: 'Validation error', 
      errors: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg
      }))
    });
    return;
  }
  next();
};

/**
 * @swagger
 * /api/auth/request-registration-otp:
 *   post:
 *     summary: Request OTP for registration (step 1)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       '200':
 *         description: OTP sent successfully
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Server error
 */
router.post('/request-registration-otp',
  sendOtpLimiter,
  [
    body('email')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail()
      .trim(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    
    console.log(`🔑 Registration OTP Request received for: ${email}`);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists but is not verified, allow re-sending OTP for verification
      if (!existingUser.isVerified) {
        console.log(`⚠️ User exists but not verified: ${email}`);
        // Generate & hash OTP for verification
        console.log(`🔐 Generating OTP for unverified user: ${email}`);
        const otp = generateNumericOtp(6);
        const hashed = await hashOtp(otp);
        console.log(`✅ OTP generated successfully`);

        // Store in Redis if available, otherwise MongoDB
        const storedInRedis = await redisStore.storeOtp(email, hashed, OTP_EXPIRY_SECONDS, { createdAt: Date.now() });
        if (!storedInRedis) {
          const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
          await OtpModel.findOneAndUpdate(
            { email },
            { 
              otp_code: otp, // Store plain OTP
              hash: hashed, 
              attempts: 0, 
              is_verified: false,
              createdAt: new Date(), 
              expiresAt,
              expiry_time: expiresAt
            },
            { upsert: true, new: true }
          );
        }

        // Send OTP email
        console.log(`📧 Initiating email send to: ${email}`);
        try {
          await sendOtpEmailUtil(email, otp);
          console.log(`✅ Registration OTP email sent successfully to ${email}`);
        } catch (emailError: any) {
          console.error(`❌ Email sending failed for ${email}:`, emailError.message);
          console.error(`❌ Error details:`, emailError);
          // Show OTP in console as fallback only in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📧 DEVELOPMENT MODE - EMAIL FAILED`);
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 OTP Code: ${otp}`);
            console.log(`⏰ Valid for ${OTP_EXPIRY_SECONDS / 60} minutes`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
          }
          return res.status(500).json({ 
            message: 'Failed to send OTP email. Please check your email address or try again later.' 
          });
        }

        return res.json({ ok: true, message: 'OTP sent to your email. Please check your inbox and spam folder to verify your account.' });
      } else {
        // User exists and is verified, suggest login instead
        console.log(`⚠️ Verified user already exists: ${email}`);
        return res.status(400).json({ 
          message: 'User already exists with this email. Please use the login option instead.',
          action: 'login'
        });
      }
    }

    // Generate & hash OTP
    console.log(`🔐 Generating OTP for: ${email}`);
    const otp = generateNumericOtp(6);
    const hashed = await hashOtp(otp);
    console.log(`✅ OTP generated successfully`);

    // Store in Redis if available, otherwise MongoDB
    const storedInRedis = await redisStore.storeOtp(email, hashed, OTP_EXPIRY_SECONDS, { createdAt: Date.now() });
    if (!storedInRedis) {
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
      await OtpModel.findOneAndUpdate(
        { email },
        { 
          otp_code: otp, // Store plain OTP
          hash: hashed, 
          attempts: 0, 
          is_verified: false,
          createdAt: new Date(), 
          expiresAt,
          expiry_time: expiresAt
        },
        { upsert: true, new: true }
      );
    }

    // Send OTP email
    console.log(`📧 Initiating email send to: ${email}`);
    try {
      await sendOtpEmailUtil(email, otp);
      console.log(`✅ Registration OTP email sent successfully to ${email}`);
    } catch (emailError: any) {
      console.error(`❌ Email sending failed for ${email}:`, emailError.message);
      console.error(`❌ Error details:`, emailError);
      // Show OTP in console as fallback only in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📧 DEVELOPMENT MODE - EMAIL FAILED`);
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 OTP Code: ${otp}`);
        console.log(`⏰ Valid for ${OTP_EXPIRY_SECONDS / 60} minutes`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      }
      return res.status(500).json({ 
        message: 'Failed to send OTP email. Please check your email address or try again later.' 
      });
    }

    res.json({ ok: true, message: 'OTP sent to your email. Please check your inbox and spam folder.' });
  } catch (error) {
    console.error('Request registration OTP error:', error);
    return next(error);
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user (Step 1: Create user, send username & OTP via email)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               role:
 *                 type: string
 *                 enum: [USER, MANAGER, ADMIN]
 *                 example: USER
 *     responses:
 *       '201':
 *         description: User registered successfully
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Server error
 */
router.post('/register', async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { email, name, phone, role } = validatedData;
    
    console.log(`🔑 Registration request for: ${email}`);
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [ { email }, { phone } ]
    });
    if (existingUser) {
      console.log(`⚠️ User already exists: ${email}`);
      return res.status(400).json({ message: 'User already exists with this email or phone' });
    }

    // Validate role assignment based on email
    if (!isRoleAssignmentValid(email, role)) {
      return res.status(400).json({ 
        message: `Role ${role} is not allowed for this email address. Only specific emails can be assigned ADMIN or MANAGER roles.` 
      });
    }

    // Generate unique username based on role
    const username = await generateUsername(role);
    
    // Generate random password for security (user won't use it)
    const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);

    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      username,
      isVerified: false, // Not verified until OTP is confirmed
      approvalStatus: role === 'MANAGER' ? 'PENDING' : 'APPROVED', // MANAGERs need admin approval
      preferences: { favoriteStations: [], notifications: true },
    } as any);

    await newUser.save();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ USER REGISTERED SUCCESSFULLY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', newUser.email);
    console.log('👤 Name:', newUser.name);
    console.log('📱 Phone:', newUser.phone);
    console.log('🔑 Username:', newUser.username);
    console.log('👥 Role:', newUser.role);
    console.log('💾 User ID:', newUser._id);
    console.log('✅ Verified:', newUser.isVerified);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Generate OTP for verification
    console.log(`🔐 Generating OTP for: ${email}`);
    const otp = generateNumericOtp(6);
    const hashed = await hashOtp(otp);

    // Store in Redis if available, otherwise MongoDB
    const storedInRedis = await redisStore.storeOtp(email, hashed, OTP_EXPIRY_SECONDS, { createdAt: Date.now() });
    if (!storedInRedis) {
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
      await OtpModel.findOneAndUpdate(
        { email },
        { 
          otp_code: otp,
          hash: hashed, 
          attempts: 0, 
          is_verified: false,
          createdAt: new Date(), 
          expiresAt,
          expiry_time: expiresAt
        },
        { upsert: true, new: true }
      );
    }

    // Send username email first
    try {
      await sendUsernameEmail(email, username, role);
      console.log(`✅ Username email sent to ${email}`);
    } catch (emailError: any) {
      console.error(`❌ Username email failed:`, emailError.message);
    }

    // Send OTP email (always show in console regardless of email success)
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔑 REGISTRATION OTP`);
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Username: ${username}`);
    console.log(`🔐 OTP Code: ${otp}`);
    console.log(`⏰ Valid for ${OTP_EXPIRY_SECONDS / 60} minutes`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    try {
      await sendOtpEmailUtil(email, otp);
      console.log(`✅ OTP email sent to ${email}`);
    } catch (emailError: any) {
      console.error(`❌ OTP email failed (OTP shown above in console):`, emailError.message);
    }

    // For MANAGER signups: notify admin for approval
    if (role === 'MANAGER') {
      const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'deepikanuti@gmail.com';
      try {
        const { sendEmail } = await import('../utils/email.js');
        await sendEmail({
          to: ADMIN_EMAIL,
          subject: `[E-Cycle] New Manager Registration Pending Approval`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px;">
              <h2 style="color:#6d28d9;">New Manager Account Pending Approval</h2>
              <p>A new manager account has been registered and is awaiting your approval.</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <tr><td style="padding:8px;font-weight:bold;color:#374151;">Name:</td><td style="padding:8px;">${name}</td></tr>
                <tr style="background:#f3f4f6;"><td style="padding:8px;font-weight:bold;color:#374151;">Email:</td><td style="padding:8px;">${email}</td></tr>
                <tr><td style="padding:8px;font-weight:bold;color:#374151;">Username:</td><td style="padding:8px;">${username}</td></tr>
                <tr style="background:#f3f4f6;"><td style="padding:8px;font-weight:bold;color:#374151;">Phone:</td><td style="padding:8px;">${phone}</td></tr>
              </table>
              <p>Please log in to the <strong>Admin Panel</strong> to approve or reject this account.</p>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/dashboard" 
                 style="display:inline-block;padding:12px 24px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
                Open Admin Panel
              </a>
            </div>
          `
        });
        console.log(`✅ Admin notified at ${ADMIN_EMAIL} about new manager: ${email}`);
      } catch (adminEmailError: any) {
        console.error(`❌ Failed to notify admin:`, adminEmailError.message);
      }
    }

    const isPendingApproval = role === 'MANAGER';
    res.status(201).json({ 
      ok: true,
      message: isPendingApproval
        ? `Registration successful! Your account is pending admin approval. You will be notified once approved. Please verify your email with the OTP sent.`
        : `Registration successful! Your username has been sent to ${email}. Please check your email for the OTP to complete verification.`,
      email,
      username,
      requiresVerification: true,
      pendingApproval: isPendingApproval
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Registration error:', error);
    return next(error);
  }
});

// Send OTP endpoint with express-validator
router.post('/send-otp', 
  sendOtpLimiter,
  [
    body('email')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail()
      .trim(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    
    console.log(`🔑 Login OTP Request received for: ${email}`);

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`⚠️ User not found in database: ${email}`);
      // For security, don't reveal if email exists
      // Always send a success response to prevent email enumeration
      return res.json({ 
        ok: true, 
        message: 'If an account exists with this email, an OTP has been sent to your inbox. Please check your email (including spam folder) for the verification code.',
        action: 'check_email' // Generic action
      });
    }

    // For unverified users, don't send OTP but guide them to registration
    if (!user.isVerified) {
      console.log(`⚠️ User found but not verified: ${email}`);
      return res.json({ 
        ok: true, 
        message: 'Your account exists but is not yet verified. Please complete the registration process first.',
        action: 'register' // Guide to registration
      });
    }

    console.log(`✅ Verified user found, generating OTP for: ${email}`);
    // Generate & hash OTP
    const otp = generateNumericOtp(6);
    const hashed = await hashOtp(otp);
    console.log(`✅ OTP generated successfully`);

    // Store in Redis if available, otherwise MongoDB
    const storedInRedis = await redisStore.storeOtp(email, hashed, OTP_EXPIRY_SECONDS, { createdAt: Date.now() });
    if (!storedInRedis) {
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
      await OtpModel.findOneAndUpdate(
        { email },
        { 
          otp_code: otp, // Store plain OTP for development visibility
          hash: hashed, 
          attempts: 0, 
          createdAt: new Date(), 
          expiresAt,
          expiry_time: expiresAt // Alias for expiresAt
        },
        { upsert: true, new: true }
      );
    }

    // Send OTP email
    console.log(`📧 Initiating email send to: ${email}`);
    try {
      await sendOtpEmailUtil(email, otp);
      console.log(`✅ Login OTP email sent successfully to ${email}`);
    } catch (emailError: any) {
      console.error(`❌ Email sending failed for ${email}:`, emailError.message);
      console.error(`❌ Error details:`, emailError);
      // Show OTP in console as fallback only in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📧 DEVELOPMENT MODE - EMAIL FAILED`);
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 OTP Code: ${otp}`);
        console.log(`⏰ Valid for ${OTP_EXPIRY_SECONDS / 60} minutes`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      }
      // Still return success to prevent email enumeration
      return res.json({ 
        ok: true, 
        message: 'If an account exists with this email, an OTP has been sent to your inbox. Please check your email (including spam folder) for the verification code.'
      });
    }

    res.json({ ok: true, message: 'If an account exists with this email, an OTP has been sent to your inbox. Please check your email (including spam folder) for the verification code.' });
  } catch (error) {
    console.error('Send OTP error:', error);
    return next(error);
  }
});

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP for registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       '200':
 *         description: OTP verified successfully
 *       '400':
 *         description: Bad request
 *       '404':
 *         description: User not found
 *       '429':
 *         description: Too many attempts
 *       '500':
 *         description: Server error
 */
router.post('/verify-otp',
  [
    body('email')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail()
      .trim(),
    body('otp')
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
      .isNumeric().withMessage('OTP must contain only numbers')
      .trim(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();
    const { email, otp } = req.body;
    
    console.log(`🔐 OTP verification attempt for ${email}`);

    // Try Redis first
    const redisRec = await redisStore.getOtpRecord(email);
    if (redisRec) {
      // Check attempts
      if ((redisRec.attempts || 0) >= OTP_MAX_VERIFY_ATTEMPTS) {
        await redisStore.deleteOtp(email);
        console.log(`⚠️ Maximum verification attempts exceeded for ${email}`);
        return res.status(429).json({ 
          success: false,
          message: 'Too many verification attempts. Please request a new OTP.',
          details: 'For security reasons, you must request a new verification code'
        });
      }
      
      // Verify OTP
      console.log(`📊 Verification attempt ${(redisRec.attempts || 0) + 1}/${OTP_MAX_VERIFY_ATTEMPTS} for ${email}`);
      const ok = await verifyOtpHash(otp, redisRec.hash);
      if (!ok) {
        await redisStore.incrementAttempts(email);
        console.log(`❌ Invalid OTP provided for ${email}`);
        return res.status(400).json({ 
          success: false,
          message: 'Invalid OTP. Please check and try again.',
          attemptsRemaining: OTP_MAX_VERIFY_ATTEMPTS - (redisRec.attempts || 0) - 1,
          details: `You have ${OTP_MAX_VERIFY_ATTEMPTS - (redisRec.attempts || 0) - 1} attempts remaining`
        });
      }
      
      // Success: delete OTP, mark user as verified, and return JWT token
      await redisStore.deleteOtp(email);
      
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      user.isVerified = true;
      await user.save();
      
      // Validate user role during verification
      if (!isRoleAssignmentValid(user.email, user.role)) {
        return res.status(403).json({ 
          message: `Access denied. Role ${user.role} is not allowed for this email address.` 
        });
      }
      
      // Generate JWT token (7 days expiry)
      const token = jwt.sign(
        { sub: user._id, role: user.role, username: user.username },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );
      
      const safeUser = { 
        _id: user._id, 
        email: user.email, 
        username: user.username, 
        role: user.role,
        name: user.name,
        phone: user.phone,
        walletBalance: user.walletBalance
      };
      
      const verificationTime = Date.now() - startTime;
      console.log(`✅ User verified successfully: ${email} in ${verificationTime}ms`);
      return res.json({ 
        success: true, 
        ok: true, 
        message: 'OTP verified successfully. You are now logged in.', 
        token, 
        user: safeUser 
      });
    }

    // Fallback to MongoDB
    const record = await OtpModel.findOne({ email });
    if (!record) {
      return res.status(400).json({ message: 'OTP expired or not found. Please request a new OTP.' });
    }
    
    if (record.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      await record.deleteOne();
      return res.status(429).json({ 
        message: 'Too many verification attempts. Please request a new OTP.' 
      });
    }
    
    const match = await verifyOtpHash(otp, record.hash);
    if (!match) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ 
        message: 'Invalid OTP. Please check and try again.',
        attemptsRemaining: OTP_MAX_VERIFY_ATTEMPTS - record.attempts
      });
    }

    // Success: remove OTP record, mark user verified, and return JWT token
    await record.deleteOne();
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isVerified = true;
    await user.save();
    
    // Validate user role during verification
    if (!isRoleAssignmentValid(user.email, user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Role ${user.role} is not allowed for this email address.` 
      });
    }
    
    // Generate JWT token (7 days expiry)
    const token = jwt.sign(
      { sub: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    const safeUser = { 
      _id: user._id, 
      email: user.email, 
      username: user.username, 
      role: user.role,
      name: user.name,
      phone: user.phone,
      walletBalance: user.walletBalance
    };
    
    console.log(`✅ User verified successfully: ${email}`);
    return res.json({ 
      ok: true, 
      message: 'OTP verified successfully. You are now logged in.', 
      token, 
      user: safeUser 
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return next(error);
  }
});


/**
 * @swagger
 * /api/auth/request-login-otp:
 *   post:
 *     summary: Request OTP for login (step 1)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: user1234@user.cutm.in
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       '200':
 *         description: OTP sent successfully
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Server error
 */
router.post('/request-login-otp',
  sendOtpLimiter,
  [
    body('username')
      .optional()
      .trim(),
    body('email')
      .optional()
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail()
      .trim(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email } = req.body;
    const identifier = email || username;

    if (!identifier) {
      return res.status(400).json({ message: 'Username or email is required' });
    }

    // Check if user exists by username or email
    const user = await User.findOne({ 
      $or: [
        { username: identifier },
        { email: identifier }
      ]
    });
    
    if (!user) {
      // For security, don't reveal if user exists or not
      return res.json({ ok: true, message: 'If the account exists, an OTP has been sent.' });
    }

    // Use email for OTP sending (since that's what we store in the OTP system)
    const emailForOtp = user.email;

    // Generate & hash OTP
    const otp = generateNumericOtp(6);
    const hashed = await hashOtp(otp);

    // Store in Redis if available, otherwise MongoDB
    const storedInRedis = await redisStore.storeOtp(emailForOtp, hashed, OTP_EXPIRY_SECONDS, { createdAt: Date.now() });
    if (!storedInRedis) {
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
      await OtpModel.findOneAndUpdate(
        { email: emailForOtp },
        { 
          otp_code: otp, // Store plain OTP for development visibility
          hash: hashed, 
          attempts: 0, 
          createdAt: new Date(), 
          expiresAt,
          expiry_time: expiresAt // Alias for expiresAt
        },
        { upsert: true, new: true }
      );
    }

    // Send OTP email — always print to console regardless of email success
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔑 LOGIN OTP`);
    console.log(`📧 Email: ${emailForOtp}`);
    console.log(`🔐 OTP Code: ${otp}`);
    console.log(`⏰ Valid for ${OTP_EXPIRY_SECONDS / 60} minutes`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    try {
      await sendOtpEmailUtil(emailForOtp, otp);
      console.log(`✅ Login OTP sent to ${emailForOtp}`);
    } catch (emailError: any) {
      console.error(`❌ Failed to send OTP email (OTP shown above in console):`, emailError.message);
      // Don't return 500 — OTP is in console, app still works
    }

    res.json({ ok: true, message: 'OTP sent to your email. Please check your inbox and spam folder.' });
  } catch (error) {
    console.error('Request login OTP error:', error);
    return next(error);
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with OTP (step 2)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: user1234@user.cutm.in
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       '200':
 *         description: Login successful
 *       '400':
 *         description: Bad request
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Server error
 */
router.post('/login', 
  loginLimiter,
  [
    body('username')
      .optional()
      .trim(),
    body('email')
      .optional()
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail()
      .trim(),
    body('otp')
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
      .isNumeric().withMessage('OTP must contain only numbers')
      .trim(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
    // Accept either username or email
    const { username, email, otp } = req.body;
    const identifier = email || username;

    if (!identifier) {
      return res.status(400).json({ message: 'Username or email is required' });
    }

    // First, find the user by username or email to get their email address
    // This is needed because OTP is always stored using the user's email as key
    const dbUser = await User.findOne({ 
      $or: [
        { username: identifier },
        { email: identifier }
      ]
    });

    if (!dbUser) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Use the user's email for OTP verification (consistent with storage)
    const emailForOtp = dbUser.email;

    // Verify OTP first
    let otpValid = false;
    
    // Try Redis first
    const redisRec = await redisStore.getOtpRecord(emailForOtp);
    if (redisRec) {
      if ((redisRec.attempts || 0) >= OTP_MAX_VERIFY_ATTEMPTS) {
        await redisStore.deleteOtp(emailForOtp);
        return res.status(429).json({ 
          message: 'Too many verification attempts. Please request a new OTP.' 
        });
      }
      
      otpValid = await verifyOtpHash(otp, redisRec.hash);
      if (!otpValid) {
        await redisStore.incrementAttempts(emailForOtp);
        return res.status(400).json({ 
          message: 'Invalid OTP. Please check and try again.',
          attemptsRemaining: OTP_MAX_VERIFY_ATTEMPTS - (redisRec.attempts || 0) - 1
        });
      }
      
      await redisStore.deleteOtp(emailForOtp);
    } else {
      // Fallback to MongoDB
      const record = await OtpModel.findOne({ email: emailForOtp });
      if (!record) {
        return res.status(400).json({ message: 'OTP expired or not found. Please request a new OTP.' });
      }
      
      if (record.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
        await record.deleteOne();
        return res.status(429).json({ 
          message: 'Too many verification attempts. Please request a new OTP.' 
        });
      }
      
      otpValid = await verifyOtpHash(otp, record.hash);
      if (!otpValid) {
        record.attempts += 1;
        await record.save();
        return res.status(400).json({ 
          message: 'Invalid OTP. Please check and try again.',
          attemptsRemaining: OTP_MAX_VERIFY_ATTEMPTS - record.attempts
        });
      }
      
      await record.deleteOne();
    }

    // Mark user as verified if not already
    if (!dbUser.isVerified) {
      dbUser.isVerified = true;
      await dbUser.save();
    }

    // Validate user role during login
    if (!isRoleAssignmentValid(dbUser.email, dbUser.role)) {
      return res.status(403).json({ 
        message: `Access denied. Role ${dbUser.role} is not allowed for this email address.` 
      });
    }

    // Block PENDING managers — must be approved by admin first
    if (dbUser.role === 'MANAGER' && (dbUser as any).approvalStatus === 'PENDING') {
      return res.status(403).json({
        message: 'Your manager account is pending approval by the administrator. You will be notified once approved.',
        approvalStatus: 'PENDING'
      });
    }

    if (dbUser.role === 'MANAGER' && (dbUser as any).approvalStatus === 'REJECTED') {
      return res.status(403).json({
        message: 'Your manager account request has been rejected. Please contact the administrator.',
        approvalStatus: 'REJECTED'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { sub: dbUser._id, role: dbUser.role, username: dbUser.username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Return user information (excluding sensitive data)
    const safeUser = { 
      _id: dbUser._id, 
      email: dbUser.email, 
      username: dbUser.username, 
      role: dbUser.role,
      name: dbUser.name,
      phone: dbUser.phone,
      walletBalance: dbUser.walletBalance
    };

    console.log(`✅ User logged in successfully: ${identifier} (${dbUser.username})`);
    res.json({ 
      ok: true,
      message: `Login successful! Welcome ${dbUser.username}`, 
      token, 
      user: safeUser,
      username: dbUser.username
    });

    } catch (error) {
        console.error(error);
        return next(error);
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', authenticate, async (req: any, res) => {
  res.json({ user: req.user });
});

/**
 * @swagger
 * /api/auth/forgot-username:
 *   post:
 *     summary: Request OTP to retrieve forgotten username
 *     tags: [Auth]
 */
router.post('/forgot-username',
  sendOtpLimiter,
  [
    body('email')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail()
      .trim(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    
    console.log(`🔑 Forgot username request for: ${email}`);

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`⚠️ User not found: ${email}`);
      // For security, don't reveal if email exists
      return res.json({ ok: true, message: 'If the email exists, an OTP has been sent.' });
    }

    console.log(`✅ User found, generating OTP for: ${email}`);
    const otp = generateNumericOtp(6);
    const hashed = await hashOtp(otp);

    // Store OTP
    const storedInRedis = await redisStore.storeOtp(email, hashed, OTP_EXPIRY_SECONDS, { createdAt: Date.now() });
    if (!storedInRedis) {
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
      await OtpModel.findOneAndUpdate(
        { email },
        { hash: hashed, attempts: 0, createdAt: new Date(), expiresAt },
        { upsert: true, new: true }
      );
    }

    // Send OTP email
    try {
      await sendOtpEmailUtil(email, otp);
      console.log(`✅ Forgot username OTP sent to ${email}`);
    } catch (emailError: any) {
      console.error(`❌ Email failed:`, emailError.message);
      return res.status(500).json({ message: 'Failed to send OTP email.' });
    }

    res.json({ ok: true, message: 'OTP sent to your email.' });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /api/auth/verify-forgot-username:
 *   post:
 *     summary: Verify OTP and retrieve username
 *     tags: [Auth]
 */
router.post('/verify-forgot-username',
  [
    body('email').isEmail().normalizeEmail().trim(),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().trim(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    let otpValid = false;
    
    // Verify OTP (check Redis first, then MongoDB)
    const redisRec = await redisStore.getOtpRecord(email);
    if (redisRec) {
      if ((redisRec.attempts || 0) >= OTP_MAX_VERIFY_ATTEMPTS) {
        await redisStore.deleteOtp(email);
        return res.status(429).json({ message: 'Too many attempts.' });
      }
      otpValid = await verifyOtpHash(otp, redisRec.hash);
      if (!otpValid) {
        await redisStore.incrementAttempts(email);
        return res.status(400).json({ message: 'Invalid OTP.' });
      }
      await redisStore.deleteOtp(email);
    } else {
      const record = await OtpModel.findOne({ email });
      if (!record) return res.status(400).json({ message: 'OTP expired.' });
      if (record.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
        await record.deleteOne();
        return res.status(429).json({ message: 'Too many attempts.' });
      }
      otpValid = await verifyOtpHash(otp, record.hash);
      if (!otpValid) {
        record.attempts += 1;
        await record.save();
        return res.status(400).json({ message: 'Invalid OTP.' });
      }
      await record.deleteOne();
    }

    // Get username
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ ok: true, username: user.username });
  } catch (error) {
    return next(error);
  }
});

export { router as authRoutes };
