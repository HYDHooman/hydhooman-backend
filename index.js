// index.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose"); // if you're using MongoDB

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection (optional if already connected)
mongoose.connect(process.env.MONGO_URI || "your-mongo-connection-url", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

// Example route
app.get("/", (req, res) => res.send("HYDHooman Backend is Live"));

// Ads Route
app.get("/ads", (req, res) => {
  res.json({
    type: "image",
    imageUrl: "https://via.placeholder.com/468x60?text=HYDHooman+Ad"
  });
});

// Banning logic (optional for your existing code)
app.post("/check-ban", (req, res) => {
  const { fingerprint } = req.body;
  // Check DB or hardcoded values here
  res.json({ banned: false });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    users[socket.id] = roomId;

    const otherUsers = Array.from(io.sockets.adapter.rooms.get(roomId) || []).filter(id => id !== socket.id);

    if (otherUsers.length > 0) {
      socket.emit("other-user", otherUsers[0]);
      socket.to(otherUsers[0]).emit("user-joined", socket.id);
    }
  });

  socket.on("offer", (payload) => {
    io.to(payload.target).emit("offer", payload);
  });

  socket.on("answer", (payload) => {
    io.to(payload.target).emit("answer", payload);
  });

  socket.on("ice-candidate", (incoming) => {
    io.to(incoming.target).emit("ice-candidate", incoming.candidate);
  });

  socket.on("disconnect", () => {
    const room = users[socket.id];
    socket.to(room).emit("user-disconnected", socket.id);
    delete users[socket.id];
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`HYDHooman backend + signaling running on port ${PORT}`);
});
