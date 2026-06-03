const express = require("express");
const cors = require("cors");
const http = require("http");
const connection = require("./db");
require("dotenv").config();
const passport = require("passport");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoutes");
const googleAuthRoutes = require("./routes/googleAuthRoutes");
const moodTrackerRoutes = require("./routes/moodTrackerRoutes");
const symptomsTrackerRoutes = require("./routes/symptomsTrackerRoutes");
const cycleTrackerRoutes = require("./routes/cycleTrackerRoutes");
const communityRoutes = require("./routes/communityRoutes");
const clinicRoutes = require("./routes/clinicRoutes");
const jwt = require("jsonwebtoken");
const Conversation = require("./models/conversation");
const Message = require("./models/message");

require("./passportConfig");
require("./passportJWT");

// Initialize app
const app = express();
const port = process.env.PORT || 4000;
const server = http.createServer(app);

// Connect to the database
connection();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport middleware
app.use(passport.initialize());

const corsOptions = {
  origin: `${process.env.FRONTEND_URL}`,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api/mood-tracker", moodTrackerRoutes);
app.use("/api/allusers", authRoutes);
app.use("/api/symptoms-tracker", symptomsTrackerRoutes);
app.use("/api/cycle-tracker", cycleTrackerRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/clinics", clinicRoutes);

// ---- Socket.IO (private rooms) ----
const io = new Server(server, {
  cors: {
    origin: `${process.env.FRONTEND_URL}`,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use((socket, next) => {
  try {
    const token =
      socket.handshake?.auth?.token ||
      socket.handshake?.headers?.authorization?.split(" ")?.[1];

    if (!token) return next(new Error("Unauthorized"));
    const secret = process.env.SECRETKEY;
    if (!secret) return next(new Error("Server not configured"));

    const decoded = jwt.verify(token, secret);
    socket.user = decoded;
    return next();
  } catch (err) {
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.on("join_room", async (conversationId) => {
    try {
      const convo = await Conversation.findOne({ conversationId }).select(
        "participants conversationId"
      );
      if (!convo) return;

      const uid = String(socket.user?._id || "");
      const allowed = (convo.participants || []).some((p) => String(p) === uid);
      if (!allowed) return;

      socket.join(conversationId);
      socket.emit("joined_room", { conversationId });
    } catch (e) {
      // ignore
    }
  });

  socket.on("send_message", async (payload) => {
    try {
      const { conversationId, body } = payload || {};
      if (!conversationId || !body) return;

      const convo = await Conversation.findOne({ conversationId }).select(
        "participants conversationId"
      );
      if (!convo) return;

      const uid = String(socket.user?._id || "");
      const allowed = (convo.participants || []).some((p) => String(p) === uid);
      if (!allowed) return;

      // Ensure sender is in the room before broadcasting.
      socket.join(conversationId);

      const msg = await Message.create({
        conversationId,
        sender: socket.user._id,
        body: String(body).slice(0, 5000),
      });

      io.to(conversationId).emit("receive_message", {
        _id: msg._id,
        conversationId: msg.conversationId,
        sender: String(msg.sender),
        body: msg.body,
        createdAt: msg.createdAt,
      });
    } catch (e) {
      // ignore
    }
  });
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
