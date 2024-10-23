import app from './app.js'
import connectDB from './src/database/db.js'
import dotenv from "dotenv"
dotenv.config({
    path:"./.env"
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`App is listining on the ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("Error - ",error)
})
