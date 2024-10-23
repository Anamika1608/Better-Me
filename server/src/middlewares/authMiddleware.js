import dotenv from "dotenv"
dotenv.config({
    path: "./.env"
})

import jwt from 'jsonwebtoken';
const JWT_SECRET =  process.env.JWT_SECRET

export const authenticate = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        console.log('No token found in cookies');
        return res.status(401).json({ message: 'No token provided' });
    }

    console.log('Token found:', token);

    try {
        const decoded = jwt.verify(token, JWT_SECRET); 
        req.user = decoded; 
        next(); 
    } catch (error) {
        console.log('Invalid token:', error);
        return res.status(403).json({ message: 'Invalid token' });
    }
};
