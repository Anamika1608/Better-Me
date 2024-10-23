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
            throw new ApiError(400, "Email and password are required.");
        }

        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json(new ApiResponse(404, {}, "User not found."))
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new ApiError(400, "Invalid password");
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
    const { name, phoneNumber, password } = req.body;
    const filepath = req?.file?.path;

    if (!name || !phoneNumber || !password || !filepath) {
        throw new ApiError(400, "All fields are required: name, phone number, password, and profile picture.");
    }

    try {
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser) {
            throw new ApiError(400, "User already exists");
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
    const { name, email, password } = req.body;
    const filepath = req?.file?.path;

    if (!name || !email || !password || !filepath) {
        throw new ApiError(400, "All fields and a profile picture are required");
    }

    if (!validator.isEmail(email)) {
        throw new ApiError(400, "Invalid email address");
    }

    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long");
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ApiError(400, "User already exists");
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
            throw new ApiError(400, "PhoneNumber and password are required.");
        }

        const user = await User.findOne({ phoneNumber });
        if (!user) {
            res.status(404).json(new ApiResponse(404, {}, "User not found."))
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new ApiError(400, "Invalid password");
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
        throw new ApiError(400, "PhoneNumber and OTP are required");
    }

    try {
        const user = await User.findOne({ phoneNumber });

        if (user) {
            const pendingOtp = await Otp.findOne({ phoneNumber });

            const currentTime = new Date();
            const otpExpirationDate = new Date(pendingOtp.otpExpiration);
            if (String(otp) !== String(pendingOtp.otp) || currentTime.getTime() > otpExpirationDate.getTime()) {
                throw new ApiError(400, "Invalid or expired OTP");
            }

            await Otp.findOneAndDelete({ phoneNumber })

            const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "12h" });
            res.cookie("token", token, { httpOnly: true });

            return res.json(new ApiResponse(200, user, "Login successful"));
        } else {
            const pendingUser = await PendingUser.findOne({ phoneNumber });

            if (!pendingUser) {
                throw new ApiError(404, "Pending registration not found");
            }

            const currentTime = new Date();
            const otpExpirationDate = new Date(pendingUser.otpExpiration);

            if (String(otp) !== String(pendingUser.otp) || currentTime.getTime() > otpExpirationDate.getTime()) {
                throw new ApiError(400, "Invalid or expired OTP");
            }

            const result = await uploadOnCloudinary(pendingUser.filepath);

            const newUser = new User({
                name: pendingUser.name,
                phoneNumber: pendingUser.phoneNumber,
                password: pendingUser.password,
                profilePicture: result.secure_url,
                twoFA: true
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
        throw new ApiError(400, "Email and OTP are required");
    }

    try {
        const user = await User.findOne({ email });

        if (user) {
            const pendingOtp = await Otp.findOne({ email });

            const currentTime = new Date();
            const otpExpirationDate = new Date(pendingOtp.otpExpiration);
            if (String(otp) !== String(pendingOtp.otp) || currentTime.getTime() > otpExpirationDate.getTime()) {
                throw new ApiError(400, "Invalid or expired OTP");
            }

            await Otp.findOneAndDelete({ email })

            const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "12h" });
            res.cookie("token", token, { httpOnly: true });

            return res.json(new ApiResponse(200, user, "Login successful"));
        } else {
            const pendingUser = await PendingUser.findOne({ email });

            if (!pendingUser) {
                throw new ApiError(404, "Pending registration not found");
            }

            const currentTime = new Date();
            const otpExpirationDate = new Date(pendingUser.otpExpiration);

            if (String(otp) !== String(pendingUser.otp) || currentTime.getTime() > otpExpirationDate.getTime()) {
                throw new ApiError(400, "Invalid or expired OTP");
            }

            const result = await uploadOnCloudinary(pendingUser.filepath);
            console.log(result)
            const newUser = new User({
                name: pendingUser.name,
                email: pendingUser.email,
                password: pendingUser.password,
                profilePicture: result.secure_url,
                twoFA: true
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
        throw new ApiError(400, "Email is required");
    }

    try {
        const isUser = await User.findOne({ email });

        if (!isUser) {
            throw new ApiError(400, "User with this email address not found");
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
            throw new ApiError(400, "Invalid or expired OTP");
        }

        user.password = newPassword
        await user.save()

        await PendingUser.findOneAndDelete({ email })

        const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "12h" });
        res.cookie("token", token, { httpOnly: true });

        return res.json(new ApiResponse(200, "Password changed successfully"));

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
        const userId = req.user.id;

        const updates = {};
        const allowedUpdates = ['name', 'profileName', 'age', 'gender', 'email', 'phone'];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const updatedUser = await User.findByIdAndUpdate(userId, updates, {
            new: true,
            runValidators: true
        });

        if (!updatedUser) {
            throw new ApiError(404, "User not found");
        }

        return res.status(200).json(new ApiResponse(200, updatedUser, "User Profile updated successfully"));
    }
    catch (error) {
        console.error('Error updating profile:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

