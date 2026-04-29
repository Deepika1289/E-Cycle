import { Ride } from '../models/Ride.js';
import { Cycle } from '../models/Cycle.js';
import { User } from '../models/User.js';
import { io } from '../server.js';

// Check for rides that should be automatically ended
export const checkAndEndScheduledRides = async () => {
  try {
    const now = new Date();
    
    // Find rides that are scheduled to end and the scheduled time has passed
    const ridesToAutoEnd = await Ride.find({
      status: 'ACTIVE',
      scheduledEndTime: { $lte: now }
    }).populate('cycle');
    
    for (const ride of ridesToAutoEnd) {
      try {
        console.log(`Auto-ending ride ${ride._id}`);
        
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - ride.startTime.getTime()) / 1000); // in seconds
        
        // Calculate cost: ₹2 per minute + ₹0.5 per 100m
        const timeCost = (duration / 60) * 2;
        const distanceCost = (ride.distance * 1000 / 100) * 0.5;
        const totalCost = Math.max(timeCost + distanceCost, 10); // Minimum ₹10
        
        // Update ride
        ride.endTime = endTime;
        ride.duration = duration;
        ride.cost = totalCost;
        ride.status = 'COMPLETED';
        // Clear the scheduled end time
        ride.scheduledEndTime = undefined;
        
        await ride.save();
        
        // Update cycle status
        await Cycle.findByIdAndUpdate(ride.cycle._id, {
          status: 'AVAILABLE',
          $inc: { totalRides: 1, totalDistance: ride.distance }
        });
        
        // Deduct cost from user wallet
        await User.findByIdAndUpdate(ride.user, {
          $inc: { walletBalance: -totalCost }
        });
        
        // Emit real-time update
        io.emit('rideEnded', {
          rideId: ride._id,
          userId: ride.user,
          cost: totalCost,
          distance: ride.distance,
          duration: duration
        });
        
        console.log(`Auto-ended ride ${ride._id} successfully`);
      } catch (error) {
        console.error(`Error auto-ending ride ${ride._id}:`, error);
      }
    }
    
    if (ridesToAutoEnd.length > 0) {
      console.log(`Processed ${ridesToAutoEnd.length} scheduled rides for auto-ending`);
    }
  } catch (error) {
    console.error('Error checking scheduled rides for auto-ending:', error);
  }
};