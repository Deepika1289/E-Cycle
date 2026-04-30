import express from 'express';
import { getOtpMetrics } from '../utils/otp.js';

const router = express.Router();

/**
 * @route GET /api/metrics/otp
 * @desc Get OTP generation and verification metrics
 * @access Private (should be restricted to admins in production)
 */
router.get('/otp', (req, res) => {
  try {
    // Get OTP utility metrics
    const utilMetrics = getOtpMetrics();
    
    // Get email delivery metrics from global object
    const deliveryMetrics = (global as any).otpMetrics || {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      totalDeliveryTimeMs: 0,
      averageDeliveryTimeMs: 0,
      lastDeliveryAttempt: null,
      lastSuccessfulDelivery: null
    };
    
    // Calculate success rates
    const verificationSuccessRate = utilMetrics.verificationCount > 0 
      ? (utilMetrics.successfulVerifications / utilMetrics.verificationCount) * 100 
      : 0;
      
    const deliverySuccessRate = deliveryMetrics.totalDeliveries > 0
      ? (deliveryMetrics.successfulDeliveries / deliveryMetrics.totalDeliveries) * 100
      : 0;
    
    // Combine metrics
    const metrics = {
      generation: {
        count: utilMetrics.generationCount
      },
      verification: {
        count: utilMetrics.verificationCount,
        successful: utilMetrics.successfulVerifications,
        failed: utilMetrics.failedVerifications,
        successRate: verificationSuccessRate,
        averageTimeMs: utilMetrics.averageVerificationTimeMs
      },
      delivery: {
        count: deliveryMetrics.totalDeliveries,
        successful: deliveryMetrics.successfulDeliveries,
        failed: deliveryMetrics.failedDeliveries,
        successRate: deliverySuccessRate,
        averageTimeMs: deliveryMetrics.averageDeliveryTimeMs,
        lastAttempt: deliveryMetrics.lastDeliveryAttempt,
        lastSuccess: deliveryMetrics.lastSuccessfulDelivery
      }
    };
    
    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error retrieving OTP metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve OTP metrics'
    });
  }
});

export default router;
