const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Admin123456789:Admin123456789@cluster0.lgu6uae.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// In-memory store
let currentAd = {
  imageUrl: "https://i.imgur.com/vKRaKDX.png"
};
let currentYouTube = "https://www.youtube.com/embed/live_stream?channel=UC4R8DWoMoI7CAwX8_LjQHig";

const userReports = {};
const bannedFingerprints = new Set();
const bannedWords = ["murder", "kill", "drugs", "terrorist", "bomb", "rape"];
let onlineUsers = 0;

app.get("/", (req, res) => {
  res.send("HYDHooman backend is live!");
});

app.get("/ads", (req, res) => {
  res.json(currentAd);
});

app.post("/update-ads", (req, res) => {
  const { type, imageUrl, script } = req.body;
  currentAd = { type, imageUrl, script };
  res.json({ success: true });
});

app.get("/youtube", (req, res) => {
  res.json({ url: currentYouTube });
});

app.post("/update-youtube", (req, res) => {
  const { url } = req.body;
  if (url && url.includes("youtube.com")) {
    currentYouTube = url;
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, error: "Invalid YouTube URL" });
  }
});

app.post("/check-ban", (req, res) => {
  const { fingerprint } = req.body;
  res.json({ banned: bannedFingerprints.has(fingerprint) });
});

app.post("/report", (req, res) => {
  const { fingerprint } = req.body;
  if (!userReports[fingerprint]) userReports[fingerprint] = 0;
  userReports[fingerprint]++;
  if (userReports[fingerprint] >= 30) {
    bannedFingerprints.add(fingerprint);
    return res.json({ banned: true });
  }
  res.json({ banned: false, reports: userReports[fingerprint] });
});

app.post("/message", (req, res) => {
  const { message } = req.body;
  const hasBannedWord = bannedWords.some(word =>
    message.toLowerCase().includes(word)
  );
  if (hasBannedWord) {
    return res.json({ error: true });
  }
  res.json({ ok: true });
});

// WebSocket for WebRTC + Online Count
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  onlineUsers++;
  io.emit("online-count", onlineUsers);

  socket.on("join-room", (roomID) => {
    socket.join(roomID);
    socket.to(roomID).emit("user-joined", socket.id);
  });

  socket.on("offer", (data) => {
    io.to(data.target).emit("offer", {
      sdp: data.sdp,
      target: socket.id
    });
  });

  socket.on("answer", (data) => {
    io.to(data.target).emit("answer", {
      sdp: data.sdp
    });
  });

  socket.on("ice-candidate", (data) => {
    io.to(data.target).emit("ice-candidate", data.candidate);
  });

  socket.on("end-call", (target) => {
    io.to(target).emit("call-ended");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    onlineUsers--;
    io.emit("online-count", onlineUsers);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 HYDHooman backend running on port ${PORT}`);
});
