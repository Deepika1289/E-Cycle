import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';

import { connectDB } from './config/database.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { stationRoutes } from './routes/stations.js';
import { cycleRoutes } from './routes/cycles.js';
import { bookingRoutes } from './routes/bookings.js';
import { rideRoutes } from './routes/rides.js';
import { paymentRoutes } from './routes/payments.js';
import { issueRoutes } from './routes/issues.js';
import { qrRoutes } from './routes/qr.js';
import { aiRoutes } from './routes/ai.js';
import { notificationRoutes } from './routes/notifications.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupSocketHandlers } from './services/socketService.js';
import { socketAuth } from './middleware/socketAuth.js';
import { analyticsRoutes } from './routes/analytics.js';
import metricsRoutes from './routes/metrics';
import zoneRoutes from './routes/zones.js';
import { checkAndEndScheduledRides } from './jobs/autoEndRides.js';

dotenv.config();

// Security middleware
const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/cycles', cycleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/zones', zoneRoutes);

// Swagger documentation
try {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'EcoRide+ API',
        version: '1.0.0',
        description: 'API documentation for the EcoRide+ bicycle booking platform'
      },
      servers: [
        {
          url: process.env.SERVER_URL || 'http://localhost:3000',
          description: 'Development server'
        }
      ]
    },
    apis: ['./src/routes/*.ts'] // files containing annotations as above
  };

  const specs = swaggerJsdoc(options);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));
} catch (error) {
  console.warn('⚠️  Swagger documentation failed to initialize:', error);
}

// Error handling middleware
app.use(errorHandler);

// Setup Socket.IO with authentication
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});

io.use(socketAuth);
setupSocketHandlers(io);

// Connect to database and start server
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API Docs available at http://localhost:${PORT}/api/docs`);
    console.log(`🌐 Frontend should be running at http://localhost:5173`);
    
    // Start the scheduler for auto-ending rides
    setInterval(checkAndEndScheduledRides, 60 * 1000); // Check every minute
    console.log('⏰ Auto-end ride scheduler started');
  });
}).catch((error) => {
  console.log('⚠️  Starting server without database connection...');
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (without database)`);
    console.log(`📚 API Docs available at http://localhost:${PORT}/api/docs`);
    console.log(`🌐 Frontend should be running at http://localhost:5173`);
    console.log('💡 Some features may not work without database connection');
  });
});

export { io };