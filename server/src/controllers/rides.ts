import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Ride } from '../models/Ride.js';
import { Booking } from '../models/Booking.js';
import { Cycle } from '../models/Cycle.js';
import { User } from '../models/User.js';
import { io } from '../server.js';
import { sendEmail } from '../utils/email.js';

// Cancel a ride (for managers)
export const cancelRide = async (req: Request, res: Response) => {
  try {
    const { rideId, reason } = req.body;
    const userId = (req as any).user._id;

    if (!rideId || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ride ID and cancellation reason are required' 
      });
    }

    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(rideId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ride ID format' 
      });
    }

    const ride = await Ride.findById(rideId)
      .populate('user', 'email name')
      .populate('cycle', 'code status');

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    if (ride.status !== 'ACTIVE' && ride.status !== 'PAUSED') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot cancel ride with status: ${ride.status}` 
      });
    }

    // Update ride status and add cancellation details
    ride.status = 'CANCELLED';
    ride.endTime = new Date();
    ride.cancellation = {
      cancelledBy: userId,
      reason,
      cancelTime: new Date(),
      refundStatus: 'PENDING'
    };

    await ride.save();

    // Update booking status
    await Booking.findByIdAndUpdate(ride.booking, { 
      status: 'CANCELLED',
      endTime: new Date()
    });

    // Update cycle status
    await Cycle.findByIdAndUpdate(ride.cycle._id, { 
      status: 'AVAILABLE' 
    });

    // Notify user via socket
    io.to(`user_${ride.user._id}`).emit('rideCancelled', {
      rideId: ride._id,
      reason,
      cancelledBy: 'MANAGER'
    });

    // Send email notification to user
    const user = ride.user as any;
    if (user && user.email) {
      sendEmail({
        to: user.email,
        subject: 'Your Ride Has Been Cancelled',
        text: `Dear ${user.name},

Your ride (ID: ${ride._id}) has been cancelled by a manager.

Reason: ${reason}

If you have any questions, please contact support.

Thank you,
The EcoRide+ Team`,
        html: `
          <h2>Ride Cancellation Notice</h2>
          <p>Dear ${user.name},</p>
          <p>Your ride (ID: <strong>${ride._id}</strong>) has been cancelled by a manager.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>If you have any questions, please contact support.</p>
          <p>Thank you,<br>The EcoRide+ Team</p>
        `
      }).catch(err => console.error('Failed to send cancellation email:', err));
    }

    return res.status(200).json({
      success: true,
      message: 'Ride cancelled successfully',
      ride
    });
  } catch (error) {
    console.error('Error cancelling ride:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel ride',
      error: (error as Error).message
    });
  }
};

// Cancel a ride (for users)
export const cancelRideByUser = async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const rideId = req.params.id;
    const userId = (req as any).user._id;

    if (!rideId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Ride ID and cancellation reason are required'
      });
    }

    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(rideId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ride ID format'
      });
    }

    const ride = await Ride.findById(rideId)
      .populate('user', 'email name')
      .populate('cycle', 'code status');

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    // Ensure the ride belongs to the requesting user
    if (String((ride as any).user?._id) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this ride' });
    }

    if (ride.status !== 'ACTIVE' && ride.status !== 'PAUSED') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ride with status: ${ride.status}`
      });
    }

    // Update ride status and add cancellation details
    ride.status = 'CANCELLED';
    ride.endTime = new Date();
    (ride as any).cancellation = {
      cancelledBy: userId,
      reason,
      cancelTime: new Date(),
      refundStatus: 'PENDING'
    };

    await ride.save();

    // Update booking status
    await Booking.findByIdAndUpdate((ride as any).booking, {
      status: 'CANCELLED',
      endTime: new Date()
    });

    // Update cycle status
    await Cycle.findByIdAndUpdate((ride as any).cycle._id, {
      status: 'AVAILABLE'
    });

    // Notify user via socket
    io.to(`user_${(ride as any).user._id}`).emit('rideCancelled', {
      rideId: (ride as any)._id,
      reason,
      cancelledBy: 'USER'
    });

    return res.status(200).json({
      success: true,
      message: 'Ride cancelled successfully',
      ride
    });
  } catch (error) {
    console.error('Error cancelling ride by user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel ride',
      error: (error as Error).message
    });
  }
};

// Schedule automatic ride ending
export const scheduleAutoEndRide = async (req: Request, res: Response) => {
  try {
    const { rideId, endTime } = req.body;
    const userId = (req as any).user._id;

    if (!rideId || !endTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ride ID and end time are required' 
      });
    }

    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(rideId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ride ID format' 
      });
    }

    // Validate that endTime is at least 5 minutes from now
    const endDateTime = new Date(endTime);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (endDateTime < fiveMinutesFromNow) {
      return res.status(400).json({ 
        success: false, 
        message: 'End time must be at least 5 minutes from now' 
      });
    }

    const ride = await Ride.findOne({
      _id: rideId,
      user: userId,
      status: 'ACTIVE'
    });

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Active ride not found' });
    }

    // Store the scheduled end time in the ride document
    ride.scheduledEndTime = endDateTime;
    await ride.save();

    // In a real implementation, we would use a job scheduler like node-cron or bull
    // For now, we'll just return success
    return res.status(200).json({
      success: true,
      message: 'Ride scheduled to end automatically',
      scheduledEndTime: endDateTime
    });
  } catch (error) {
    console.error('Error scheduling auto end ride:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to schedule auto end ride',
      error: (error as Error).message
    });
  }
};

// Get all active rides (for managers)
export const getAllActiveRides = async (req: Request, res: Response) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    
    const rides = await Ride.find({ status: 'ACTIVE' })
      .populate('user', 'name email')
      .populate('cycle', 'code model')
      .sort({ startTime: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Ride.countDocuments({ status: 'ACTIVE' });

    return res.status(200).json({
      success: true,
      rides,
      pagination: {
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching active rides:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active rides',
      error: (error as Error).message
    });
  }
};