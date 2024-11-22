import express from "express";
import cors from "cors";
import session from 'express-session';
import cookieParser from "cookie-parser";
import http from 'http';
import authRoutes from "./src/routes/userRoute.js";
import attributeRoutes from './src/routes/attributeRoute.js';
import expertroutes from './src/routes/expertRoute.js';
import shopRoutes from './src/routes/shopRoute.js';
import orderRoutes from './src/routes/orderRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import notificationRoutes from './src/routes/notificationRoute.js';
import articleRoutes from './src/routes/articleRoutes.js';
import friendRoutes from './src/routes/friendRoutes.js'
import initializeSocket from './src/helpers/socketConnection.js';
import { Server } from 'socket.io';
import commentRoutes from './src/routes/commentRoutes.js'
import superAdminRoutes from './src/routes/superAdminRoutes.js'
import musicMediaRoutes from './src/routes/musicMediaRoutes.js'
import filmMediaRoutes from './src/routes/filmMediaRoutes.js'
import artMediaRoutes from './src/routes/artMediaRoutes.js'
import artistRoutes from './src/routes/artistRoutes.js'

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

initializeSocket(io);


app.use(cors({
  origin: process.env.CORS_ORIGIN || "*"
}));

app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/user", authRoutes);
app.use("/api/friend/", friendRoutes)
app.use("/api/attribute", attributeRoutes);
app.use("/api/expert", expertroutes);
app.use("/api/artist", artistRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin/articles", articleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/comment", commentRoutes)
app.use("/api/superAdmin", superAdminRoutes)
app.use("/api/employee", superAdminRoutes)
app.use('/api/superAdmin/media/music', musicMediaRoutes);
app.use('/api/superAdmin/media/films', filmMediaRoutes);
app.use('/api/superAdmin/media/art', artMediaRoutes);
app.get('/', (req, res) => {
  res.send("Server is up and running");
});

export { server, io } 
