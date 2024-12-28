import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5174", // Adjust this to match your frontend URL
    methods: ["GET", "POST"]
  }
});

app.use(cors());

const PORT = process.env.PORT || 3000;

// Store connected users
const users = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join', (username) => {
    users.set(socket.id, username);
    io.emit('userList', Array.from(users.values()));
    socket.broadcast.emit('userJoined', username);
    console.log(`${username} joined the call`);
  });

  socket.on('offer', (offer) => {
    console.log('Received offer from', socket.id);
    socket.broadcast.emit('offer', offer, socket.id);
  });

  socket.on('answer', (answer, targetSocketId) => {
    console.log('Received answer from', socket.id, 'for', targetSocketId);
    socket.to(targetSocketId).emit('answer', answer);
  });

  socket.on('iceCandidate', (candidate) => {
    console.log('Received ICE candidate from', socket.id);
    socket.broadcast.emit('iceCandidate', candidate);
  });

  socket.on('chatMessage', (message) => {
    const username = users.get(socket.id);
    io.emit('chatMessage', { username, message });
  });

  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    users.delete(socket.id);
    io.emit('userList', Array.from(users.values()));
    socket.broadcast.emit('userLeft', username);
    console.log('User disconnected:', username);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

console.log('Server test: OK');