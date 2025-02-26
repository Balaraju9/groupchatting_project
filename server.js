const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Adjust this to your frontend URL
  },
});

// MongoDB connection string
const mongoURI =
  "mongodb+srv://balarajumarisetti06:Balaraju%40154721@cluster0.05se4.mongodb.net/groupchatting?retryWrites=true&w=majority";

// User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  socketId: { type: String, required: true },
});

// User model
const User = mongoose.model('User', userSchema);

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Emit the number of active users
  User.countDocuments({})
    .then((count) => socket.emit('howmanyusers', count))
    .catch((err) => console.error('Error fetching user count:', err));

  // Handle new user connection
  socket.on('new-user', async (name) => {
    try {
      // Save the new user to MongoDB
      const newUser = new User({ username: name, socketId: socket.id });
      await newUser.save();
      console.log(`User connected: ${name}`);

      // Broadcast the new user connection to all clients
      socket.broadcast.emit('user-connected', name);

      // Emit the updated user list to all clients
      const users = await User.find({}, { username: 1, _id: 0 });
      io.emit('update-user-list', users.map((user) => user.username));
    } catch (err) {
      console.error('Error saving user:', err);
    }
  });

  // Handle file sharing
  socket.on('send-file', async (data) => {
    try {
      // Retrieve the username from MongoDB
      const user = await User.findOne({ socketId: data.fileuser });
      if (user) {
        data.userName = user.username;
        socket.broadcast.emit('receive-file', data);
      }
    } catch (err) {
      console.error('Error retrieving user:', err);
    }
  });

  // Handle chat messages
  socket.on('send-chat-message', async (message) => {
    try {
      // Retrieve the username from MongoDB
      const user = await User.findOne({ socketId: socket.id });
      if (user) {
        socket.broadcast.emit('chat-message', {
          message: message,
          name: user.username,
          id1: socket.id,
        });
      }
    } catch (err) {
      console.error('Error retrieving user:', err);
    }
  });

  // Handle user disconnection
  socket.on('disconnect', async () => {
    try {
      // Find and remove the disconnected user from MongoDB
      const user = await User.findOneAndDelete({ socketId: socket.id });
      if (user) {
        console.log(`User disconnected: ${user.username}`);
        io.emit('user-disconnected', user.username);

        // Emit the updated user list to all clients
        const users = await User.find({}, { username: 1, _id: 0 });
        io.emit('update-user-list', users.map((user) => user.username));

        // Emit the updated user count
        const count = await User.countDocuments({});
        io.emit('howmanyusers', count);
      }
    } catch (err) {
      console.error('Error removing user:', err);
    }
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server running on port 3000');
});
