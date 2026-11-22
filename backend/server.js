
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const dns = require("dns");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

const productRoutes = require("./routes/productRoutes.js");
const orderRoutes = require("./routes/orderRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const queueRoutes = require("./routes/queueRoutes.js");

dotenv.config();

// DNS configuration
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "https://desarapen.vercel.app"
];

// Express CORS
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(cookieParser());

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"]
  },
  transports: ["polling", "websocket"]
});

// Socket connection
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", (reason) => {
    console.log("Client disconnected:", socket.id, reason);
  });
});

app.set("io", io);

// API routes
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/queue", queueRoutes);

// Cookie test
app.get("/test-cookie", (req, res) => {
  const token = req.cookies?.authToken;

  if (!token) {
    return res.status(401).json({
      message: "No token found."
    });
  }

  return res.status(200).json({
    message: "Cookie received successfully!"
  });
});

// MongoDB connection and server startup
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server started on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB error:", err);
    process.exit(1);
  });
