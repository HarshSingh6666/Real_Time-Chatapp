require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const admin = require("firebase-admin");
const { Server } = require("socket.io"); 
const http = require("http");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Models & Routes
const User = require("./models/User"); 
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require('./routes/userRoutes');

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);

// ================= MIDDLEWARES =================
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:8080", "http://localhost:5173", "https://open-talks.netlify.app"], 
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ================= FIREBASE SETUP =================
try {
    let serviceAccount;
    let privateKey;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        privateKey = serviceAccount.private_key
            ? serviceAccount.private_key.replace(/\\n/g, '\n') 
            : undefined;
    } else {
        try {
            serviceAccount = require("./firebase-service-key.json");
            privateKey = serviceAccount.private_key;
        } catch (e) {
            console.log("⚠️ No local firebase file found, relying on Env Vars.");
        }
    }

    if (serviceAccount && privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: serviceAccount.project_id,
                clientEmail: serviceAccount.client_email,
                privateKey: privateKey 
            })
        });
        console.log("🔥 Firebase Admin Initialized Successfully");
    } else {
        console.log("⚠️ Firebase Warning: Notifications won't work.");
    }
} catch (error) {
    console.log("⚠️ Firebase Config Error: " + error.message);
}

// ================= DB CONNECTION =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB Error:", err));


// ================= ROUTES =================

// 1. Direct Register/Signup Route
app.post('/register', async (req, res) => {
    try {
        const { username, name, email, password, age, phone } = req.body;
        
        console.log(`📩 Processing registration for: ${email}`);

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists. Please login." });
        }

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ 
            username, 
            name, 
            email, 
            password: hashedPassword, 
            age, 
            phone 
        });
        
        console.log("✅ User Created:", newUser.email);
        res.status(201).json({ message: "Account created successfully!", user: newUser });
    } catch (error) { 
        console.error("❌ Registration Error:", error);
        res.status(500).json({ message: "Error creating user", error: error.message }); 
    }
});

// 2. Login Route (Slightly reformatted, but logic is the same)
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", { expiresIn: "30d" });

        res.status(200).json({
            message: "Login Successful",
            token,
            user: { _id: user._id, name: user.name, email: user.email, pic: user.pic }
        });
    } catch (error) { 
        console.error("❌ Login Error:", error);
        res.status(500).json({ message: "Server Error" }); 
    }
});

// Use Imported Routes
app.use('/api/users', userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/messages", messageRoutes);

// ================= CLOUDINARY SETUP =================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// const upload = multer({ dest: "uploads/" });

// app.post("/api/upload", upload.single("file"), async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ message: "No file uploaded" });
//     const result = await cloudinary.uploader.upload(req.file.path, { folder: "aura_chat", resource_type: "auto" });
//     fs.unlinkSync(req.file.path);
//     res.status(200).json({ url: result.secure_url });
//   } catch (error) {
//     if (req.file) fs.unlinkSync(req.file.path);
//     res.status(500).json({ message: "Upload failed" });
//   }
// });

const upload = multer({ storage: storage });

app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        // Buffer ko Cloudinary me upload karne ke liye stream use karte hain
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "aura_chat", resource_type: "auto" },
            (error, result) => {
                if (error) return res.status(500).json({ message: "Upload failed", error });
                res.status(200).json({ url: result.secure_url });
            }
        );

        // Buffer se data pass karo stream me
        const { Readable } = require('stream');
        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);

    } catch (error) {
        res.status(500).json({ message: "Server error during upload" });
    }
});

// ================= 🔥 SOCKET LOGIC =================
// const io = new Server(server, {
//   pingTimeout: 60000,
//   cors: { 
//     origin: ["http://localhost:8080", "https://open-talks.netlify.app/"],
//     methods: ["GET", "POST"],
//     credentials: true
//   },
// });

const io = new Server(server, {
  pingTimeout: 60000,
  cors: { 
    // ✅ Added http://localhost:5173
    origin: ["http://localhost:8080", "http://localhost:5173", "https://open-talks.netlify.app"],
    methods: ["GET", "POST"],
    credentials: true
  },
});

app.set('io', io); 

let userSocketMap = {}; 
let liveSessions = {};  
let disconnectTimers = {};

io.on("connection", (socket) => {
  console.log("🔌 Socket Connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
      userSocketMap[userId] = socket.id;
      socket.join(userId); 
      io.emit("get-users", Object.keys(userSocketMap).map((id) => ({ userId: id })));
      socket.emit("update-live-sessions", Object.values(liveSessions));
  }

  socket.on("join_channel", (room) => {
      if(!room) return;
      socket.join(room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  // Call Logic
  socket.on("callUser", (data) => {
      const socketId = userSocketMap[data.userToCall];
      if(socketId) io.to(socketId).emit("callUser", { signal: data.signalData, from: data.from, name: data.name });
  });
  socket.on("answerCall", (data) => {
      const socketId = userSocketMap[data.to];
      if(socketId) io.to(socketId).emit("callAccepted", data.signal);
  });

  // Live Stream Logic
  socket.on("start-live", (data) => {
    const { roomId, title, user } = data;
    if (disconnectTimers[roomId]) {
        clearTimeout(disconnectTimers[roomId]);
        delete disconnectTimers[roomId];
    }
    liveSessions[roomId] = { roomId, hostId: socket.id, title, hostData: user, viewers: liveSessions[roomId]?.viewers || [] };
    socket.join(roomId);
    io.emit("update-live-sessions", Object.values(liveSessions));
  });

  socket.on("join-live", ({ roomId, user }) => {
    const session = liveSessions[roomId];
    if (session) {
      socket.join(roomId);
      if(!session.viewers.includes(socket.id)) session.viewers.push(socket.id);
      io.to(session.hostId).emit("viewer-joined", { viewerId: socket.id, user });
      io.emit("update-live-sessions", Object.values(liveSessions));
    }
  });

  socket.on("end-live", (roomId) => {
    if (liveSessions[roomId]) {
      io.to(roomId).emit("live-ended"); 
      delete liveSessions[roomId];
      io.emit("update-live-sessions", Object.values(liveSessions));
    }
  });

  // WebRTC Signaling
  socket.on("live-offer", ({ offer, viewerId }) => io.to(viewerId).emit("live-offer", { offer, hostId: socket.id }));
  socket.on("live-answer", ({ answer, hostId }) => io.to(hostId).emit("live-answer", { answer, viewerId: socket.id }));
  socket.on("live-ice-candidate", ({ candidate, targetId }) => io.to(targetId).emit("live-ice-candidate", { candidate, senderId: socket.id }));

  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected:", socket.id);
    if (userId) {
        delete userSocketMap[userId];
        io.emit("get-users", Object.keys(userSocketMap).map((id) => ({ userId: id })));
    }
    
    const roomId = Object.keys(liveSessions).find(id => liveSessions[id].hostId === socket.id);
    if (roomId) {
       disconnectTimers[roomId] = setTimeout(() => {
           if (liveSessions[roomId]) {
               io.to(roomId).emit("live-ended");
               delete liveSessions[roomId];
               io.emit("update-live-sessions", Object.values(liveSessions));
           }
       }, 30000); 
    }
  });
});

// ================= SERVER START =================
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});