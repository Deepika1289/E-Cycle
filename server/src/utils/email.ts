import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Get current directory (ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from server root
const envPath = join(__dirname, '../../.env');
console.log(`🔍 Trying to load .env from: ${envPath}`);
console.log(`🔍 File exists: ${existsSync(envPath)}`);
dotenv.config({ path: envPath });

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

// Debug logging
console.log('📧 Email Configuration:');
console.log('  SMTP_HOST:', SMTP_HOST ? '✅ Set' : '❌ Missing');
console.log('  SMTP_PORT:', SMTP_PORT);
console.log('  SMTP_USER:', SMTP_USER ? '✅ Set' : '❌ Missing');
console.log('  SMTP_PASS:', SMTP_PASS ? '✅ Set' : '❌ Missing');
console.log('  SMTP_FROM:', SMTP_FROM);

let transporter: nodemailer.Transporter | null = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  // Special configuration for Gmail
  if (SMTP_HOST.includes('gmail')) {
    console.log('📧 Using Gmail-specific configuration');
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: { 
        user: SMTP_USER, 
        pass: SMTP_PASS 
      },
      // Add timeout and connection options
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }

  // Test SMTP connection on startup
  console.log('🔌 Testing SMTP connection...');
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ SMTP Connection Error:', error.message);
      console.error('❌ Error Code:', (error as any).code || 'N/A');
      console.error('❌ Full Error:', error);
      console.error('💡 Possible fixes:');
      console.error('   1. Enable 2-Step Verification in Gmail');
      console.error('   2. Generate App Password: https://myaccount.google.com/apppasswords');
      console.error('   3. Use the 16-character App Password in SMTP_PASS');
      console.error('   4. Check if "Less secure app access" is enabled (not recommended)');
      console.error('   5. Verify SMTP_USER and SMTP_PASS are correct in .env');
    } else {
      console.log('✅ SMTP Connection verified - Ready to send emails!');
      console.log('✅ Email service is operational');
    }
  });
} else {
  console.error('❌ SMTP configuration incomplete!');
  console.error('   Missing:', 
    !SMTP_HOST ? 'SMTP_HOST' : '',
    !SMTP_USER ? 'SMTP_USER' : '',
    !SMTP_PASS ? 'SMTP_PASS' : ''
  );
}

/**
 * Send OTP verification email to user
 * @param to - Recipient email address
 * @param otp - 6-digit OTP code
 * @throws Error if email sending fails
 */
/**
 * Send username notification email to new user
 * @param to - Recipient email address
 * @param username - Generated username
 * @param role - User role
 * @throws Error if email sending fails
 */
export const sendUsernameEmail = async (to: string, username: string, role: string): Promise<void> => {
  console.log(`📧 Attempting to send username email to: ${to}`);
  
  if (!transporter) {
    const errorMsg = 'SMTP transporter not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env file';
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    const errorMsg = `Invalid email address: ${to}`;
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">🚲 EcoRide+</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Welcome to Our Platform!</p>
      </div>
      <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0; font-size: 24px; font-weight: 600;">🎉 Registration Successful!</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">Thank you for registering with EcoRide+! Your account has been created successfully.</p>
        
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10b981; border-radius: 12px; padding: 24px; margin: 30px 0;">
          <p style="color: #059669; font-size: 14px; font-weight: 600; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px; text-align: center;">Your Login Username</p>
          <div style="font-size: 28px; font-weight: 700; color: #059669; text-align: center; font-family: 'Courier New', monospace; word-break: break-all;">${username}</div>
          <p style="color: #047857; font-size: 12px; margin: 12px 0 0 0; text-align: center;">Role: ${role}</p>
        </div>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
            <strong>📝 Important:</strong> Please save this username. You'll need it to login to your account.
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h3 style="color: #495057; font-size: 16px; margin-top: 0; margin-bottom: 12px;">Next Steps:</h3>
          <ol style="color: #6c757d; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Save your username in a secure place</li>
            <li>Check your email for the OTP verification code</li>
            <li>Complete verification to activate your account</li>
            <li>Login using your email and OTP</li>
          </ol>
        </div>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; line-height: 1.6;">
          This is an automated email from <strong>EcoRide+</strong> official system. If you didn't register for this account, please contact our support team immediately.
        </p>
        <div style="text-align: center; margin-top: 24px;">
          <p style="color: #888; font-size: 11px; margin: 0;">© 2025 EcoRide+. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  const textVersion = `EcoRide+ - Registration Successful!

🎉 Welcome to EcoRide+!

Your account has been created successfully.

Your Login Username: ${username}
Role: ${role}

📝 IMPORTANT: Please save this username. You'll need it to login.

Next Steps:
1. Save your username in a secure place
2. Check your email for the OTP verification code
3. Complete verification to activate your account
4. Login using your email and OTP

This is an automated email from EcoRide+ official system.

© 2025 EcoRide+
All rights reserved.`;

  try {
    console.log(`📨 Sending username email via SMTP...`);
    console.log(`   From: ${SMTP_FROM}`);
    console.log(`   To: ${to}`);
    
    const info = await transporter.sendMail({
      from: `"EcoRide+ Official" <${SMTP_FROM}>`,
      to,
      subject: '🎉 Welcome to EcoRide+ - Your Username',
      text: textVersion,
      html,
    });
    
    console.log(`✅ Username email sent successfully!`);
    console.log(`   Recipient: ${to}`);
    console.log(`   Message ID: ${info.messageId}`);
  } catch (error: any) {
    console.error(`❌ Failed to send username email to ${to}`);
    console.error(`❌ Error Message: ${error.message}`);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Send OTP verification email to user
 * @param to - Recipient email address
 * * @param otp - 6-digit OTP code
 * @throws Error if email sending fails
 */
export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
  console.log(`📧 Attempting to send OTP email to: ${to}`);
  
  // If transporter is not configured, proceed and let the try/catch fallback handle it
  if (!transporter) {
    console.warn('⚠️ SMTP transporter not configured. Will use fallback mode (console OTP)');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    const errorMsg = `Invalid email address: ${to}`;
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Validate OTP format (6 digits)
  if (!/^\d{6}$/.test(otp)) {
    const errorMsg = 'OTP must be a 6-digit numeric code';
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  console.log(`✅ Email validation passed for: ${to}`);
  console.log(`✅ OTP format validated: ${otp.length} digits`);
  console.log(`📤 Preparing email content...`);

  const expiryMinutes = Number(process.env.OTP_EXPIRY_SECONDS || 300) / 60;

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">🚲 EcoRide+</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">AI-Enhanced Cycle Booking Platform</p>
      </div>
      <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0; font-size: 24px; font-weight: 600;">Email Verification Required</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">Thank you for registering with EcoRide+! Please use the following One-Time Password (OTP) to verify your email address and complete your registration.</p>
        
        <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border: 2px dashed #667eea; border-radius: 12px; padding: 24px; text-align: center; margin: 30px 0;">
          <p style="color: #667eea; font-size: 14px; font-weight: 600; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
          <div style="font-size: 36px; font-weight: 700; color: #667eea; letter-spacing: 12px; font-family: 'Courier New', monospace;">${otp}</div>
        </div>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
            <strong>⏰ Important:</strong> This code expires in <strong>${expiryMinutes} minutes</strong> for security reasons.
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h3 style="color: #495057; font-size: 16px; margin-top: 0; margin-bottom: 12px;">Security Tips:</h3>
          <ul style="color: #6c757d; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Never share this OTP with anyone</li>
            <li>Our team will never ask for your OTP</li>
            <li>If you didn't request this, please ignore this email</li>
          </ul>
        </div>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; line-height: 1.6;">
          This is an automated email from <strong>EcoRide+</strong> official system. If you have any questions or concerns, please contact our support team.
        </p>
        <div style="text-align: center; margin-top: 24px;">
          <p style="color: #888; font-size: 11px; margin: 0;">© 2025 EcoRide+. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  const textVersion = `EcoRide+ - Email Verification

Thank you for registering with EcoRide+!

Your One-Time Password (OTP) verification code is: ${otp}

⏰ This code expires in ${expiryMinutes} minutes.

Security Tips:
- Never share this OTP with anyone
- Our team will never ask for your OTP
- If you didn't request this, please ignore this email

This is an automated email from EcoRide+ official system.

© 2025 EcoRide+
All rights reserved.`;

  // Always display OTP in console for testing/debugging regardless of environment
  console.log('\n');
  console.log('🔑 ====================================== 🔑');
  console.log(`🔑 OTP CODE FOR TESTING: ${otp}`);
  console.log(`🔑 Email: ${to}`);
  console.log('🔑 ====================================== 🔑');
  console.log('\n');

  try {
    const startTime = Date.now();
    console.log(`📨 Sending email via SMTP...`);
    console.log(`   From: ${SMTP_FROM}`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: 🚲 EcoRide+ - Email Verification Code`);
    
    // Check if SMTP is properly configured
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !transporter) {
      throw new Error('SMTP not properly configured. Using fallback mode.');
    }
    
    const info = await transporter.sendMail({
      from: `"EcoRide+ Official" <${SMTP_FROM}>`,
      to,
      subject: '🚲 EcoRide+ - Email Verification Code',
      text: textVersion,
      html,
    });
    
    const deliveryTime = Date.now() - startTime;
    console.log(`✅ OTP email sent successfully!`);
    console.log(`   Recipient: ${to}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response || 'OK'}`);
    console.log(`📊 Delivery time: ${deliveryTime}ms`);
    
    // Track metrics in global object
    if (!(global as any).otpMetrics) {
      (global as any).otpMetrics = {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        totalDeliveryTimeMs: 0,
        averageDeliveryTimeMs: 0,
        lastDeliveryAttempt: null,
        lastSuccessfulDelivery: null
      };
    }
    
(global as any).otpMetrics.totalDeliveries++;
    (global as any).otpMetrics.successfulDeliveries++;
    (global as any).otpMetrics.totalDeliveryTimeMs += deliveryTime;
    (global as any).otpMetrics.averageDeliveryTimeMs = 
      (global as any).otpMetrics.totalDeliveryTimeMs / (global as any).otpMetrics.successfulDeliveries;
    (global as any).otpMetrics.lastDeliveryAttempt = new Date().toISOString();
    (global as any).otpMetrics.lastSuccessfulDelivery = new Date().toISOString();
  } catch (error: any) {
    const failureTime = Date.now();
    
    // Track metrics for failed deliveries
    if (!(global as any).otpMetrics) {
      (global as any).otpMetrics = {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        totalDeliveryTimeMs: 0,
        averageDeliveryTimeMs: 0,
        lastDeliveryAttempt: null,
        lastSuccessfulDelivery: null
      };
    }
    
    (global as any).otpMetrics.totalDeliveries++;
    (global as any).otpMetrics.failedDeliveries++;
    (global as any).otpMetrics.lastDeliveryAttempt = new Date().toISOString();
    console.error(`❌ Failed to send OTP email to ${to}`);
    console.error(`❌ Error Type: ${error.code || error.name || 'Unknown'}`);
    console.error(`❌ Error Message: ${error.message}`);
    
    // Provide specific error guidance
    if (error.code === 'EAUTH') {
      console.error('💡 Authentication failed - Check your Gmail App Password');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('💡 Connection failed - Check internet or SMTP server');
    } else if (error.code === 'EENVELOPE') {
      console.error('💡 Invalid email address - Verify recipient email');
    }
    
    // FALLBACK MODE: Always display OTP in console when email fails
    console.log('\n');
    console.log('🔴 EMAIL DELIVERY FAILED - FALLBACK ACTIVATED 🔴');
    console.log('📱 ====================================== 📱');
    console.log(`📱 OTP for ${to}: ${otp}`);
    console.log('📱 ====================================== 📱');
    console.log('🔴 USE THIS OTP FOR TESTING PURPOSES 🔴');
    console.log('\n');
    
    // Don't throw error to allow testing without email
    console.log('✅ Fallback mode: Continuing without throwing error');
    return; // Return successfully to allow OTP verification to work
  }
};

/**
 * Generic email sender used by controllers (e.g., ride cancellation notices)
 * Sends via configured SMTP if available; otherwise logs and returns without throwing.
 */
export const sendEmail = async ({
  to,
  subject,
  text,
  html
}: { to: string; subject: string; text?: string; html?: string }): Promise<void> => {
  console.log(`📧 Attempting to send email to: ${to} | Subject: ${subject}`);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    const errorMsg = `Invalid email address: ${to}`;
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // If no transporter, log and return (fallback)
  if (!transporter || !SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️ SMTP not configured. Skipping actual send; email content below for debugging:');
    console.log('--- EMAIL DEBUG START ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    if (text) console.log(`Text: ${text}`);
    if (html) console.log(`HTML: ${html.substring(0, 400)}...`);
    console.log('--- EMAIL DEBUG END ---');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"EcoRide+ Official" <${SMTP_FROM}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`✅ Email sent successfully to ${to} | Message ID: ${info.messageId}`);
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${to}: ${error.message}`);
    // Do not throw to avoid breaking flows; controllers may choose to continue
  }
};