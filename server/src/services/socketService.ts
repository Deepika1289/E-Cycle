import { Server } from 'socket.io';

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket) => {
    const user = (socket as any).user;
    console.log(`🔌 User connected: ${socket.id}`);

    // Join user to their personal room for notifications
    if (user) {
      socket.join(`user_${user._id}`);
      console.log(`User ${user._id} joined their room`);
    }

    // Handle ride location updates
    socket.on('updateLocation', (data) => {
      // Broadcast location update to relevant listeners
      socket.broadcast.emit('locationUpdate', {
        rideId: data.rideId,
        location: data.location,
        timestamp: new Date()
      });
    });

    // Handle cycle availability updates
    socket.on('cycleStatusUpdate', (data) => {
      socket.broadcast.emit('cycleStatusChanged', data);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
    });
  });

  return io;
};