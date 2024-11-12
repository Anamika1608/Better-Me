import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const JWT_SECRET = process.env.JWT_SECRET;

const initializeSocket = (io) => {
 
  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('authenticate', async () => {
      console.log('Authenticate event received');
      try {
        const cookies = socket.handshake.headers.cookie;
        console.log('cookies - ', cookies)
        if (!cookies) {
          console.error('No cookies found');
          socket.emit('auth_error', { message: 'No cookies found' });
          return;
        }

        const token = cookies.split('; ').find(row => row.startsWith('token=')).split('=')[1];

        if (!token) {
          console.error('No token found in cookies');
          socket.emit('auth_error', { message: 'No token provided' });
          return;
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token verified successfully:', decoded);

        socket.user = decoded;

        const user = await User.findById(decoded.id);
        if (user) {
          socket.join(user._id.toString());
          console.log(`User ${user._id} authenticated and joined their room`);
        } else {
          console.error('User not found');
          socket.emit('auth_error', { message: 'User not found' });
        }
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('auth_error', { message: 'Invalid token' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};

export default initializeSocket;
