const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const dns = require("dns")
const cookieParser = require("cookie-parser")
const http = require("http")
const { Server } = require("socket.io")

const productRoutes = require("./routes/productRoutes.js")
const orderRoutes = require("./routes/orderRoutes.js")
const userRoutes = require("./routes/userRoutes.js")
const queueRoutes = require("./routes/queueRoutes.js")


dns.setServers(['8.8.8.8', '8.8.8.4'])  



dotenv.config()



const app = express()   
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))


app.use(express.json()) 
app.use(cookieParser())

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5000", 'https://desarapen-backend.onrender.com/'],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
})

io.on("connection", (socket) => {
  console.log("Client connected", socket.id)

  socket.on("disconnect", ()=> {
    console.log("Client disconnected", socket.id)
  })
})


app.set("io", io)


app.use("/api/products", productRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/users", userRoutes)
app.use("/api/queue", queueRoutes)


app.get("/test-cookie", (req, res) => {
  const token = req.cookies?.authToken;

  console.log("Token:", token);

  if (!token) {
    return res.status(401).json({
      message: "No token found.",
    });
  }

  return res.status(200).json({
    message: "Cookie received successfully!",
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});

const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGODB_URI)
    .then(()=> {
        console.log("Connected to mongodb")
        app.listen(PORT, ()=> console.log(`Server started on port ${PORT}`))
    })
    .catch((err) => console.error("DB error", err))