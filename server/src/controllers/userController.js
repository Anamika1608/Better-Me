// import dotenv from "dotenv"
// dotenv.config({
//     path: "./.env"
// })

import jwt from 'jsonwebtoken';
import validator from 'validator';
import User from '../models/userModel.js';
import Otp from '../models/otpModel.js';
import bcrypt from 'bcryptjs'
import randomstring from 'randomstring';
import otpGenerator from 'otp-generator';

import sendVerificationEmail from '../helpers/sendEmail.js'
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import uploadOnCloudinary from '../utils/cloudinary.js';
import PendingUser from '../models/pendingUserModel.js';
import sendVerificationSms from '../helpers/sendSms.js';

const JWT_SECRET = process.env.JWT_SECRET;


export const loginUserWithMail = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(200).json(new ApiResponse(400, null, "Email and password are required"));
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json(new ApiResponse(404, null, "User not found"));
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(200).json(new ApiResponse(400, null, "Invalid password"));
        }

        if (user.twoFA) {
            const existingPendingOtp = await Otp.findOne({ email })

            const otp = randomstring.generate({ length: 5, charset: '123456789' });
            const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);

            if (existingPendingOtp) {
                await Otp.findOneAndUpdate({ email: email }, { otp, otpExpiration })
                await sendVerificationEmail(user.name, user.email, otp);
                return res.json(new ApiResponse(200, null, "OTP sent to your email. Please verify your email to complete registration."));
            }

            const newOtp = new Otp({
                email,
                otp,
                otpExpiration
            })

            await newOtp.save()

            await sendVerificationEmail(user.name, user.email, otp);

            return res.json(new ApiResponse(200, null, "OTP sent to your email. Please verify to complete login."));
        }

        const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "12h" });
        res.cookie("token", token, { httpOnly: true });

        return res.json(new ApiResponse(200, null, "Login successful."));
    } catch (error) {
        console.error("Error during login with email:", error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const registerUserWithNumber = async (req, res) => {
    const { name, phoneNumber, password, role } = req.body;
    const filepath = req?.file?.path;

    if (!name || !phoneNumber || !password || !filepath) {
        return res.status(200).json(new ApiResponse(400, null, "All fields are required: name, phone number, password, and profile picture."));
    }

    try {
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(200).json(new ApiResponse(400, null, "User already exists"));
        }
        const existingPendingUser = await PendingUser.findOne({ phoneNumber })

        const otp = randomstring.generate({ length: 5, charset: '123456789' });
        const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);

        if (existingPendingUser) {
            await PendingUser.findOneAndUpdate({ phoneNumber }, { otp, otpExpiration })
            await sendVerificationSms(otp, phoneNumber)
            return res.json(new ApiResponse(200, null, "OTP sent to your number. Please verify your number to complete registration."));
        }
        const newPendingUser = new PendingUser({
            name,
            phoneNumber,
            password,
            role,
            filepath,
            otp,
            otpExpiration
        });

        await newPendingUser.save();

        await sendVerificationSms(otp, phoneNumber)

        return res.json(new ApiResponse(200, null, "OTP sent to your number. Please verify your number to complete registration."));

    } catch (error) {
        console.error("Error during registration:", error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const registerUserWithMail = async (req, res) => {
    const { name, email, password, role } = req.body;
    const filepath = req?.file?.path;

    if (!name || !email || !password || !role || !filepath) {
        return res.status(200).json(new ApiResponse(400, null, "All fields and a profile picture are required"));
    }

    if (!validator.isEmail(email)) {
        return res.status(200).json(new ApiResponse(400, null, "Invalid email address"));
    }

    if (password.length < 6) {
        return res.status(200).json(new ApiResponse(400, null, "Password must be at least 6 characters long"));
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(200).json(new ApiResponse(400, null, "User already exists"));
        }
        const existingPendingUser = await PendingUser.findOne({ email })

        const otp = randomstring.generate({ length: 5, charset: '123456789' });
        const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
        if (existingPendingUser) {
            await PendingUser.findOneAndUpdate({ email: email }, { otp, otpExpiration })
            await sendVerificationEmail(name, email, otp);
            return res.json(new ApiResponse(200, null, "OTP sent to your email. Please verify your email to complete registration."));
        }
        const newPendingUser = new PendingUser({
            name,
            email,
            password,
            filepath,
            role,
            otp,
            otpExpiration
        });

        await newPendingUser.save();
        await sendVerificationEmail(name, email, otp);

        return res.json(new ApiResponse(200, null, "OTP sent to your email. Please verify your email to complete registration."));
    } catch (error) {
        console.error("Error during registration with email:", error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const loginUserWithNumber = async (req, res) => {
    const { phoneNumber, password } = req.body;

    try {
        if (!phoneNumber || !password) {
            return res.status(200).json(new ApiResponse(400, null, "PhoneNumber and password are required."));
        }

        const user = await User.findOne({ phoneNumber });
        if (!user) {
            res.status(404).json(new ApiResponse(404, null, "User not found."))
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(200).json(new ApiResponse(400, null, "Invalid password"));
        }

        if (user.twoFA) {
            const existingPendingOtp = await Otp.findOne({ phoneNumber })

            const otp = randomstring.generate({ length: 5, charset: '123456789' });
            const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);

            if (existingPendingOtp) {
                await Otp.findOneAndUpdate({ phoneNumber }, { otp, otpExpiration })
                await sendVerificationSms(otp, phoneNumber)
                return res.json(new ApiResponse(200, null, "OTP sent to your number. Please verify your number to complete registration."));
            }

            const newOtp = new Otp({
                phoneNumber,
                otp,
                otpExpiration
            })

            await newOtp.save()

            await sendVerificationSms(otp, phoneNumber)
            return res.json(new ApiResponse(200, null, "OTP sent to your email. Please verify to complete login."));
        }

        const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "12h" });
        res.cookie("token", token, { httpOnly: true });

        return res.json(new ApiResponse(200, null, "Login successful."));
    } catch (error) {
        console.error("Error during login with email:", error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const verifyUserNumber = async (req, res) => {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
        return res.status(200).json(new ApiResponse(400, null, "PhoneNumber and otp are required."));
    }

    try {
        const user = await User.findOne({ phoneNumber });

        if (user) {
            const pendingOtp = await Otp.findOne({ phoneNumber });

            const currentTime = new Date();
            const otpExpirationDate = new Date(pendingOtp.otpExpiration);
            if (String(otp) !== String(pendingOtp.otp) || currentTime.getTime() > otpExpirationDate.getTime()) {
                return res.status(200).json(new ApiResponse(400, null, "Invalid or expired OTP"));
            }

            await Otp.findOneAndDelete({ phoneNumber })

            const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "12h" });
            res.cookie("token", token, { httpOnly: true });

            return res.json(new ApiResponse(200, user, "Login successful"));
        } else {
            const pendingUser = await PendingUser.findOne({ phoneNumber });

            if (!pendingUser) {
                return res.status(200).json(new ApiResponse(400, null, "Pending registration not found"));
            }

            const currentTime = new Date();
            const otpExpirationDate = new Date(pendingUser.otpExpiration);

            if (String(otp) !== String(pendingUser.otp) || currentTime.getTime() > otpExpirationDate.getTime()) {
                return res.status(200).json(new ApiResponse(400, null, "Invalid or expired OTP"));
            }

            const result = await uploadOnCloudinary(pendingUser.filepath);

            const newUser = new User({
                name: pendingUser.name,
                phoneNumber: pendingUser.phoneNumber,
                password: pendingUser.password,
                profilePicture: result.secure_url,
                role: "user"
            });

            await newUser.save();

            await PendingUser.deleteOne({ phoneNumber });

            const token = jwt.sign({ id: newUser._id.toString() }, JWT_SECRET, { expiresIn: "12h" });
            res.cookie("token", token, { httpOnly: true });

            return res.json(new ApiResponse(201, newUser, "User registered and logged in successfully"));
        }

    } catch (error) {
        console.error('Error verifying OTP:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const verifyUserEmail = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(200).json(new ApiResponse(400, null, "Email and OTP are required"));
    }

    try {
        const user = await User.findOne({ email });

        if (user) {
            const pendingOtp = await Otp.findOne({ email });

            const currentTime = new Date();
            const otpExpirationDate = new Date(pendingOtp.otpExpiration);
            if (String(otp) !== String(pendingOtp.otp) || currentTime.getTime() > otpExpirationDate.getTime()) {
                return res.status(200).json(new ApiResponse(400, null, "Invalid or expired OTP"));
            }

            await Otp.findOneAndDelete({ email })

            const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "12h" });
            res.cookie("token", token, { httpOnly: true });

            return res.json(new ApiResponse(200, user, "Login successful"));
        } else {
            const pendingUser = await PendingUser.findOne({ email });

            if (!pendingUser) {
                return res.status(200).json(new ApiResponse(400, null, "Pending registration not found"));
            }

            const currentTime = new Date();
            const otpExpirationDate = new Date(pendingUser.otpExpiration);

            if (String(otp) !== String(pendingUser.otp) || currentTime.getTime() > otpExpirationDate.getTime()) {
                return res.status(200).json(new ApiResponse(400, null, "Invalid or expired OTP"));
            }

            const result = await uploadOnCloudinary(pendingUser.filepath);
            console.log(result)
            const newUser = new User({
                name: pendingUser.name,
                email: pendingUser.email,
                password: pendingUser.password,
                profilePicture: result.secure_url,
                role: "user"
            });

            await newUser.save();

            await PendingUser.deleteOne({ email });

            const token = jwt.sign({ id: newUser._id.toString() }, JWT_SECRET, { expiresIn: "12h" });
            res.cookie("token", token, { httpOnly: true });

            return res.json(new ApiResponse(201, newUser, "User registered and logged in successfully"));
        }

    } catch (error) {
        console.error('Error in OTP verification and user processing:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const forgetPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(200).json(new ApiResponse(400, null, "Email is required"));
    }

    try {
        const isUser = await User.findOne({ email });

        if (!isUser) {
            return res.status(200).json(new ApiResponse(400, null, "User with this email address not found"));
        }
        const existingPendingUser = await PendingUser.findOne({ email })

        const otp = randomstring.generate({ length: 5, charset: '123456789' });
        const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
        if (existingPendingUser) {
            await PendingUser.findOneAndUpdate({ email }, { otp, otpExpiration })
            await sendVerificationEmail(isUser.name, email, otp);
            return res.json(new ApiResponse(200, null, "OTP sent to your email. Please verify your email to reset your password"));
        }
        const newPendingUser = new PendingUser({
            email,
            otp,
            otpExpiration
        });

        await newPendingUser.save();
        await sendVerificationEmail(isUser.name, email, otp);

        return res.json(new ApiResponse(200, null, "OTP sent to your email. Please verify your email to reset your password"));
    } catch (error) {
        console.error("Error during registration with email:", error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const resetPassword = async (req, res) => {

    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });

    try {

        const pendingOtp = await PendingUser.findOne({ email });

        const currentTime = new Date();
        const otpExpirationDate = new Date(pendingOtp.otpExpiration);
        if (String(otp) !== String(pendingOtp.otp) || currentTime.getTime() > otpExpirationDate.getTime()) {
            return res.status(200).json(new ApiResponse(400, null, "Invalid or expired OTP"));
        }

        user.password = newPassword
        await user.save()

        await PendingUser.findOneAndDelete({ email })

        const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "12h" });
        res.cookie("token", token, { httpOnly: true });

        return res.json(new ApiResponse(200, null, "Password changed successfully"));

    }
    catch (error) {
        console.error('Error saving the new password:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const logout = (req, res) => {
    res.clearCookie("token");
    return res.json(new ApiResponse(200, null, "Logged out successfully"));
};

export const updateUserProfile = async (req, res) => {
    try {
        let userId = "";
        if (req.user.role != "superAdmin") userId = req.user.id;
        else userId = req.params.id;
        const updates = {};
        const allowedUpdates = ['name', 'profileName', 'age', 'gender', 'email', 'phone'];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const deleteUser = await User.findByIdAndUpdate(userId, updates, {
            new: true,
            runValidators: true
        });

        if (!deleteUser) {
            return res.status(200).json(new ApiResponse(400, null, "User not found"));
        }

        return res.status(200).json(new ApiResponse(200, deleteUser, "User Profile updated successfully"));
    }
    catch (error) {
        console.error('Error updating profile:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const deleteUserProfile = async (req, res) => {
    try {
        let userId;

        if (req.user && req.user.role !== "superAdmin") {
            userId = req.user.id;
        } else {
            userId = req.params.id;
        }

        if (!userId) {
            return res.status(400).json(new ApiResponse(400, null, "User ID is required"));
        }

        const deleteUser = await User.findOneAndDelete({ _id: userId });

        if (!deleteUser) {
            return res.status(404).json(new ApiResponse(404, null, "User not found"));
        }

        return res.status(200).json(new ApiResponse(200, deleteUser, "User deleted successfully"));
    } catch (error) {
        console.error('Error deleting user profile:', error);
        return res.status(500).json(new ApiError(500, "Internal server error", [error.message]));
    }
};
