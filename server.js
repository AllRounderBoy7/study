
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const activeRooms = {}; // To track connected clients per room

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('join', (room) => {
    socket.join(room);
    if (!activeRooms[room]) activeRooms[room] = new Set();
    activeRooms[room].add(socket.id);

    io.to(room).emit('message', `🔵 A new user joined the room: ${room}`);
  });

  socket.on('message', ({ room, message }) => {
    io.to(room).emit('message', message);
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        activeRooms[room]?.delete(socket.id);
        io.to(room).emit('message', '🔴 A user left the room.');
        if (activeRooms[room]?.size === 0) {
          delete activeRooms[room]; // Room stays permanent logically, but cleared from memory
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
