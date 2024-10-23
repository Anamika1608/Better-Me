import express from "express"
import cors from "cors"
import session from 'express-session';
import cookieParser from "cookie-parser"
import authRoutes from "./src/routes/userRoute.js"
import attributeRoutes from './src/routes/attributeRoute.js'
import expertroutes from './src/routes/expertRoute.js'
import shopRoutes from './src/routes/shopRoute.js'
import orderRoutes from './src/routes/orderRoutes.js'
import cartRoutes from './src/routes/cartRoutes.js'
const jwt_secret = process.env.JWT_SECRET
import articleRoutes from './src/routes/articleRoutes.js'
import friendRoutes from './src/routes/friendRoutes.js'
const app= express()
app.use(cors({
    origin: process.env.CORS_ORIGIN
}))
app.use(session({
    secret: jwt_secret, 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
})); 
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ limit: "16kb", extended: true }))
app.use(express.static("public"))
app.use(cookieParser())
app.use("/api/user", authRoutes);
app.use("/api/friend/", friendRoutes)
app.use("/api/attribute", attributeRoutes);
app.use("/api/expert", expertroutes)
app.use("/api/shop",shopRoutes)
app.use("/api/order",orderRoutes)
app.use("/api/cart",cartRoutes)
app.use("/api/admin/articles", articleRoutes)
export default app;