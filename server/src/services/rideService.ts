import { Ride } from '../models/Ride.js';
import { Booking } from '../models/Booking.js';
import { Cycle } from '../models/Cycle.js';
import mongoose from 'mongoose';

export type RideState = 'AVAILABLE' | 'BOOKED' | 'IN_RIDE' | 'COMPLETED' | 'CANCELLED';

const allowedTransitions: Record<RideState, RideState[]> = {
  AVAILABLE: ['BOOKED'],
  BOOKED: ['IN_RIDE', 'CANCELLED'],
  IN_RIDE: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

export async function startRideFromBooking(bookingId: string, userId: string) {
  const session = await mongoose.startSession();
  try {
    let rideDoc;
    await session.withTransaction(async () => {
      const booking = await Booking.findById(bookingId).session(session);
      if (!booking) throw new Error('Booking not found');
      if (booking.user.toString() !== userId) throw new Error('Forbidden');
      if (booking.status !== 'CONFIRMED') throw new Error('Booking not confirmed');

      const cycle = await Cycle.findById(booking.cycle).session(session);
      if (!cycle) throw new Error('Cycle not found');
      if (cycle.status !== 'BOOKED') throw new Error('Cycle is not booked');

      const [created] = await Ride.create([{
        booking: booking._id,
        user: booking.user,
        cycle: booking.cycle,
        status: 'ACTIVE',
        startLocation: undefined,
        startTime: new Date(),
        route: []
      }], { session });
      booking.status = 'CONFIRMED';
      await booking.save({ session });

      cycle.status = 'IN_USE';
      await cycle.save({ session });

      rideDoc = created;
    });
    return rideDoc as any;
  } finally {
    session.endSession();
  }
}

export async function completeRide(rideId: string) {
  const session = await mongoose.startSession();
  try {
    let ride;
    await session.withTransaction(async () => {
      ride = await Ride.findById(rideId).session(session);
      if (!ride) throw new Error('Ride not found');
      if (ride.status !== 'ACTIVE') throw new Error('Ride not active');

      ride.status = 'COMPLETED';
      ride.endTime = new Date();
      await ride.save({ session });

      const cycle = await Cycle.findById(ride.cycle).session(session);
      if (cycle) {
        cycle.status = 'AVAILABLE';
        await cycle.save({ session });
      }
    });
    return ride;
  } finally {
    session.endSession();
  }
}
