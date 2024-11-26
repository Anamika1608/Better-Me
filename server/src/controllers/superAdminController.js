import uploadOnCloudinary from "../utils/cloudinary.js";
import User from "../models/userModel.js";
import Expert from "../models/expertModel.js";
import Artist from "../models/artistModel.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import validator from 'validator';

export const createUser = async (req, res) => {
    const { userName, email, password, profileName, age, gender, phoneNumber, role} = req.body;
    console.log(req.body);
    const filepath = req?.file?.path;

    const result = await uploadOnCloudinary(filepath);

    if(!req.user) {
        return res.status(200).json(new ApiResponse(400, null, "SuperAdmin is not loggedin yet!"));
    }

    if (!userName || !email || !password || !role || !profileName || !age || !gender || !phoneNumber ) {
        return res.status(200).json(new ApiResponse(400, null, "All fields and a profile picture are required"));
    }

    if (!validator.isEmail(email)) {
        return res.status(200).json(new ApiResponse(400, null, "Invalid email address"));
    }

    if (password.length < 6) {
        return res.status(200).json(new ApiResponse(400, null, "Password must be at least 6 characters long"));
    }
    try {
        const newUser = new User({
            name : userName,
            email,
            password,
            profileName,
            age,
            gender,
            phoneNumber,
            role,
            profilePicture: result.secure_url,
        });
    
        await newUser.save();
        return res.json(new ApiResponse(200, null, "User registered successfully"));
    } catch (error) {
        console.error('Error in registering user by superAdmin', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }

}

export const createExpert = async(req,res)=>{
    const { name, email, password, age, gender, phoneNumber , expertise , topRated } = req.body;
    const filepath = req?.file?.path;

    const result = await uploadOnCloudinary(filepath);
    console.log(result);

    const newExpert = new Expert({
        name,
        email,
        password,
        age,
        gender,
        phoneNumber,
        expertise,
        topRated,
        profilePicture: result.secure_url,
    });

    await newExpert.save();
    return res.json(new ApiResponse(200, null, "Expert registered successfully"));
}

export const createArtist = async(req,res)=>{
    const { name, email, password, age, gender, phoneNumber } = req.body;
    const filepath = req?.file?.path;

    const result = await uploadOnCloudinary(filepath);
    console.log(result);

    const newArtist = new Artist({
        name,
        email,
        password: password,
        age,
        gender,
        phoneNumber,
        profilePicture: result.secure_url,
    });

    await newArtist.save();
    return res.json(new ApiResponse(200, null, "Artist registered successfully"));
}