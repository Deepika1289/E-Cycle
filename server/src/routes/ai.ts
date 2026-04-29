import { Router } from 'express';
import { z } from 'zod';
import { Cycle } from '../models/Cycle.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const recommendationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  preferences: z.object({
    batteryLevel: z.number().min(0).max(100).optional(),
    maxDistance: z.number().min(0.1).max(10).optional() // km
  }).optional()
});

const faqSchema = z.object({
  query: z.string().min(1, 'Query is required')
});

// In a real implementation, FAQ data would come from a database
// For now, we'll keep the mock data but structure it to be easily replaceable
const faqData = [
  {
    question: "How do I unlock a cycle?",
    answer: "After confirming your booking and payment, scan the QR code on the cycle using our app. You'll receive an unlock token to start your ride.",
    keywords: ["unlock", "qr", "code", "scan", "start"]
  },
  {
    question: "What are the charges for riding?",
    answer: "We charge ₹2 per minute and ₹0.5 per 100 meters traveled. There's a minimum charge of ₹10 per ride.",
    keywords: ["charges", "cost", "price", "money", "rate"]
  },
  {
    question: "How do I report a damaged cycle?",
    answer: "Go to the Issues section in the app, select 'Cycle Damage', describe the problem, and submit. Our team will investigate immediately.",
    keywords: ["damage", "broken", "report", "issue", "problem"]
  },
  {
    question: "Can I park anywhere on campus?",
    answer: "Cycles must be parked within designated campus boundaries. The app will show you valid parking zones and nearby stations.",
    keywords: ["park", "parking", "station", "location", "campus"]
  },
  {
    question: "What if my ride gets interrupted?",
    answer: "If you need to pause your ride, contact support immediately. We can help resolve payment and cycle return issues.",
    keywords: ["interrupt", "pause", "stop", "problem", "support"]
  }
];

/**
 * @swagger
 * /api/ai/recommendations:
 *   post:
 *     summary: Get AI-powered cycle recommendations
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
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
 *               preferences:
 *                 type: object
 *                 properties:
 *                   batteryLevel:
 *                     type: number
 *                     example: 50
 *                   maxDistance:
 *                     type: number
 *                     example: 2
 *     responses:
 *       '200':
 *         description: AI recommendations
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Server error
 */
router.post('/recommendations', authenticate, async (req: any, res, next) => {
  try {
    const validatedData = recommendationSchema.parse(req.body);
    const user = await User.findById(req.user._id);
    
    // Build query for available cycles
    let query: any = {
      status: 'AVAILABLE',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [validatedData.longitude, validatedData.latitude]
          },
          $maxDistance: (validatedData.preferences?.maxDistance || 2) * 1000 // Convert to meters
        }
      }
    };

    // Filter by battery level if specified
    if (validatedData.preferences?.batteryLevel) {
      query.batteryLevel = { $gte: validatedData.preferences.batteryLevel };
    }

    const cycles = await Cycle.find(query)
      .populate('station', 'name facilities')
      .limit(10);

    // AI scoring algorithm
    const recommendedCycles = cycles.map(cycle => {
      let score = 100;
      
      // Distance scoring (closer = better)
      const deltaLat = cycle.location.coordinates[1] - validatedData.latitude;
      const deltaLng = cycle.location.coordinates[0] - validatedData.longitude;
      const distance = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng) * 111; // Rough km
      score -= distance * 20;

      // Battery level scoring
      if (cycle.batteryLevel) {
        score += cycle.batteryLevel * 0.3;
      }

      // Station preference scoring
      if (cycle.station && user?.preferences.favoriteStations.includes(cycle.station._id)) {
        score += 15;
      }

      // Maintenance scoring (recent maintenance = better)
      const daysSinceMaintenace = (Date.now() - cycle.lastMaintenance.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceMaintenace < 7) {
        score += 10;
      }

      return {
        cycle: cycle.toObject(),
        score: Math.round(score),
        distance: Math.round(distance * 1000), // in meters
        reasons: [
          distance < 0.5 ? 'Very close to you' : distance < 1 ? 'Close to you' : 'Within walking distance',
          cycle.batteryLevel && cycle.batteryLevel > 80 ? 'High battery level' : '',
          cycle.station && user?.preferences.favoriteStations.includes(cycle.station._id) ? 'Your favorite station' : '',
          daysSinceMaintenace < 7 ? 'Recently maintained' : ''
        ].filter(Boolean)
      };
    });

    // Sort by score
    recommendedCycles.sort((a, b) => b.score - a.score);

    res.json({
      recommendations: recommendedCycles.slice(0, 5),
      query: {
        location: [validatedData.latitude, validatedData.longitude],
        preferences: validatedData.preferences
      }
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
 * /api/ai/faq:
 *   post:
 *     summary: Get FAQ answer using AI
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 example: "How do I unlock a cycle?"
 *     responses:
 *       '200':
 *         description: FAQ answer
 *       '400':
 *         description: Validation error
 *       '500':
 *         description: Server error
 */
router.post('/faq', async (req, res, next) => {
  try {
    const validatedData = faqSchema.parse(req.body);
    const query = validatedData.query.toLowerCase();
    
    // Simple keyword matching algorithm
    let bestMatch = null;
    let bestScore = 0;
    
    for (const faq of faqData) {
      let score = 0;
      
      // Check if query words match keywords
      const queryWords = query.split(' ');
      for (const word of queryWords) {
        if (word.length > 2) { // Only consider words longer than 2 characters
          for (const keyword of faq.keywords) {
            if (keyword.includes(word) || word.includes(keyword)) {
              score += 1;
            }
          }
          
          // Check question and answer text
          if (faq.question.toLowerCase().includes(word) || faq.answer.toLowerCase().includes(word)) {
            score += 0.5;
          }
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = faq;
      }
    }

    if (bestMatch && bestScore > 0.5) {
      res.json({
        answer: bestMatch.answer,
        question: bestMatch.question,
        confidence: Math.min(bestScore / 3, 1), // Normalize confidence
        relatedQuestions: faqData
          .filter(f => f !== bestMatch)
          .slice(0, 3)
          .map(f => f.question)
      });
    } else {
      res.json({
        answer: "I couldn't find a specific answer to your question. Please contact our support team for assistance, or try asking about cycle unlocking, charges, reporting issues, or parking.",
        confidence: 0,
        relatedQuestions: faqData.slice(0, 3).map(f => f.question)
      });
    }
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
 * /api/ai/faq/all:
 *   get:
 *     summary: Get all FAQ entries
 *     tags: [AI]
 *     responses:
 *       '200':
 *         description: List of all FAQ entries
 *       '500':
 *         description: Server error
 */
router.get('/faq/all', async (req, res, next) => {
  try {
    // In a real implementation, this would fetch FAQ data from a database
    // For now, we'll return the mock data
    res.json({
      faqs: faqData.map(faq => ({
        question: faq.question,
        answer: faq.answer
      }))
    });
  } catch (error) {
    return next(error);
  }
});

export { router as aiRoutes };