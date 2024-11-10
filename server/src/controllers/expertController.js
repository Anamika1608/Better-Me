import { ApiResponse } from '../utils/ApiResponse.js';
import Expert from '../models/expertModel.js';
import Otp from '../models/otpModel.js';
import Masterclass from '../models/masterClassModel.js';
import ApiError from '../utils/ApiError.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import User from '../models/userModel.js';
import PendingUser from '../models/pendingUserModel.js';

import jwt from "jsonwebtoken"


const JWT_SECRET = process.env.JWT_SECRET;


export const postMasterclass = async (req, res) => {
    try {
        const { title, tags } = req.body;
        const expertId = req.user.id;

        if (!title || !tags) {
            return res.status(200).json(new ApiResponse(400, null, 'Title and content are required.'));
        }

        if (!req.file) {
            return res.status(200).json(new ApiResponse(400, null, 'No video file uploaded.'));
        }

        const filePath = req.file.path;

        const result = await uploadOnCloudinary(filePath);

        if (!result) {
            throw new ApiError(500, 'Failed to upload video to Cloudinary.');
        }

        const expert = await Expert.findOne({ user: expertId })
        console.log(expert)
        const newMasterclass = new Masterclass({
            expert: expert._id,
            title,
            tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
            video: result.secure_url
        });

        const savedMasterclass = await newMasterclass.save();

        await Expert.findOneAndUpdate(
            { user: expertId },
            { $push: { masterclasses: savedMasterclass._id } },
            { new: true, runValidators: true }
        );

        res.status(201).json(
            new ApiResponse(201, {
                masterclass: savedMasterclass
            }, 'Masterclass created successfully')
        );
    } catch (error) {
        console.error('Error in postMasterclass:', error);
        res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode || 500, error.message)
        );
    }
};

export const editMasterclass = async (req, res) => {
    try {
        const classId = req.params.classId;
        const updates = {};
        const allowedUpdates = ['title', 'tags'];

        if (!classId) return res.status(200).json(new ApiResponse(400, null, "Masterclass id is required"));

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const updatedClass = await Masterclass.findByIdAndUpdate(classId, updates, {
            new: true,
            runValidators: true
        });

        if (!updatedClass) {
            return res.status(200).json(new ApiResponse(400, null, "Materclass not updated"));
        }

        return res.status(200).json(new ApiResponse(200, null, "Masterclass updated successfully"));
    } catch (error) {
        console.error('Error updating masterclass:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
}

export const deleteMasterClass = async (req, res) => {
    try {
        const classId = req.params.classId;

        if (!classId) return res.status(200).json(new ApiResponse(400, null, "Masterclass id is required"));

        const deleteClass = await Masterclass.findByIdAndDelete(classId);

        if (!deleteClass) {
            return res.status(200).json(new ApiResponse(400, null, "Materclass not deleted"));
        }

        return res.status(200).json(new ApiResponse(200, null, "Masterclass deleted successfully"));
    } catch (error) {
        console.error('Error deleting masterclass:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
}

export const verifyExpertEmail = async (req, res) => {
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
            console.log(pendingUser);
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

            const userRole = pendingUser.role;
            const newUser = new User({
                name: pendingUser.name,
                email: pendingUser.email,
                password: pendingUser.password,
                role: userRole,
                profilePicture: result.secure_url,
            });

            await newUser.save();

            if (userRole == "expert") {
                const newExpert = new Expert({
                    user: newUser._id
                });

                await newExpert.save();
            } else if (userRole == "superAdmin") {
                const newAdmin = new SuperAdmin({
                    user: newUser._id
                });

                await newAdmin.save()
            } else if (userRole == "artist") {
                const newArtist = new Artist({
                    user: newUser._id
                });

                await newArtist.save()
            }

            await PendingUser.deleteOne({ email });

            const token = jwt.sign({ id: newUser._id.toString() }, JWT_SECRET, { expiresIn: "12h" });
            res.cookie("token", token, { httpOnly: true });

            return res.json(new ApiResponse(201, newUser, `${userRole} registered and logged in successfully`));
        }

    } catch (error) {
        console.error('Error in OTP verification and user processing:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const verifyExpertNumber = async (req, res) => {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
        return res.status(200).json(new ApiResponse(400, "PhoneNumber and OTP are required"));
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
            const userRole = pendingUser.role;
            const newUser = new User({
                name: pendingUser.name,
                phoneNumber: pendingUser.phoneNumber,
                password: pendingUser.password,
                profilePicture: result.secure_url,
                role: userRole
            });

            await newUser.save();


            if (role == "expert") {
                const newExpert = new Expert({
                    user: newUser._id
                });

                await newExpert.save();
            } else if (role == "superAdmin") {
                const newAdmin = new SuperAdmin({
                    user: newUser._id
                });

                await newAdmin.save()
            } else if (role == "artist") {
                const newArtist = new Artist({
                    user: newUser._id
                });

                await newArtist.save()
            }


            await PendingUser.deleteOne({ phoneNumber });

            const token = jwt.sign({ id: newUser._id.toString() }, JWT_SECRET, { expiresIn: "12h" });
            res.cookie("token", token, { httpOnly: true });

            return res.json(new ApiResponse(201, newUser, `${userRole} registered and logged in successfully`));
        }

    } catch (error) {
        console.error('Error verifying OTP:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const updateExpertProfile = async (req, res) => {
    try {
        let expertId = "";
        if (req.user.role !== "superAdmin") expertId = req.user.id;
        else expertId = req.params.id;

        const userUpdates = {};
        const expertUpdates = {};
        const userAllowedUpdates = ['name', 'profileName', 'age', 'gender', 'email', 'phone'];
        const expertAllowedUpdates = ['expertise', 'topRated'];

        userAllowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                userUpdates[field] = req.body[field];
            }
        });

        expertAllowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                expertUpdates[field] = req.body[field];
            }
        });

        const expert = await Expert.findById(expertId);
        if (!expert) {
            return res.status(200).json(new ApiResponse(404, null, "Expert not found"));
        }

        if (Object.keys(userUpdates).length > 0) {
            const userId = expert.user.toString();
            const updatedUser = await User.findByIdAndUpdate(userId, userUpdates, {
                new: true,
                runValidators: true
            });

            if (!updatedUser) {
                return res.status(200).json(new ApiResponse(400, null, "User not found"));
            }
        }

        if (Object.keys(expertUpdates).length > 0) {
            await Expert.findByIdAndUpdate(expertId, expertUpdates, {
                new: true,
                runValidators: true
            });
        }

        if (req.body.expertTag) {
            await Expert.findOneAndUpdate(
                { user: expert.user.toString() },
                { expertTag: req.body.expertTag },
                { new: true, runValidators: true }
            );
        }

        return res.status(200).json(new ApiResponse(200, null, "Expert Profile updated successfully"));
    } catch (error) {
        console.error('Error updating profile:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};

export const trackMasterclassView = async (req, res) => {
    try {
        const { masterclassId } = req.body;
        const userId = req.user.id;

        const masterclass = await Masterclass.findById(masterclassId)
            .populate({
                path: 'expert',
                populate: {
                    path: 'user',
                    model: 'User'
                }
            });

        if (!masterclass) {
            return res.status(200).json(new ApiResponse(400, null, 'Masterclass not found'));
        }

        if (masterclass.expert.user._id.toString() === userId.toString()) {
            return res.status(200).json(new ApiResponse(400, null, 'Creator cannot be counted as a viewer'));
        }

        const alreadyViewed = masterclass.viewedBy.includes(userId);

        if (!alreadyViewed) {
            masterclass.viewedBy.push(userId);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (!masterclass.views.length) {
                masterclass.views = [
                    { count: 1 },
                    { dateViewed: today }
                ];
            } else {
                masterclass.views = [
                    { count: (masterclass.views[0]?.count || 0) + 1 },
                    { dateViewed: today }
                ];
            }

            console.log('Before save - views array:', masterclass.views);

            const updatedMasterclass = await masterclass.save();

            console.log('After save - views array:', updatedMasterclass.views);

            return res.status(200).json(new ApiResponse(200, {
                totalViews: updatedMasterclass.views[0].count,
                viewDate: updatedMasterclass.views[1].dateViewed
            }, 'View tracked successfully'));
        }
        return res.status(200).json(new ApiResponse(200, {
            totalViews: masterclass.views[0]?.count || 0
        }, 'Already viewed by this user'));

    } catch (error) {
        console.error('Error tracking masterclass view:', error);
        throw new ApiError(500, "Error tracking masterclass view", [error.message]);
    }
};

export const getMasterclassViews = async (req, res) => {
    try {
        const { masterclassId } = req.body;

        const masterclass = await Masterclass.findById(masterclassId)
            .populate('viewedBy', 'name email');

        if (!masterclass) {
            return res.status(200).json(new ApiResponse(400, null, 'Masterclass not found'));
        }
        return res.status(200).json(new ApiResponse(200, {
            totalViews: masterclass.views[0]?.count || 0,
            lastViewDate: masterclass.views[1]?.dateViewed,
            uniqueViewers: masterclass.viewedBy.length,
            viewers: masterclass.viewedBy
        }, 'View tracked successfully'));


    } catch (error) {
        console.error('Error fetching view statistics:', error);
        throw new ApiError(500, "Error fetching view statistics", [error.message]);
    }
};

export const deleteExpertProfile = async (req, res) => {
    try {
        let userId = null;
        let userRole = null;
        if (req.user && req.user.role !== "superAdmin") {
            userId = req.user.id;
            userRole = req.user.role;
        } else {
            userId = req.params.id;
            userRole = req.body.userRole;
        }

        if (!userId) {
            return res.status(400).json(new ApiResponse(400, null, "User ID is required"));
        }

        let deleteUserRole = null;
        if (userRole === "expert") {
            deleteUserRole = await Expert.findByIdAndDelete(userId);
        } else if (userRole === "artist") {
            deleteUserRole = await Artist.findByIdAndDelete(userId);
        }

        if (!deleteUserRole) {
            return res.status(200).json(new ApiResponse(404, null, "User not found in the specified role"));
        }

        const deleteUser = await User.findByIdAndDelete(deleteUserRole.user.toString());

        if (!deleteUser) {
            return res.status(200).json(new ApiResponse(404, null, "User not found"));
        }

        return res.status(200).json(new ApiResponse(200, "User deleted successfully"));
    } catch (error) {
        console.error('Error deleting profile:', error);
        throw new ApiError(500, "Internal server error", [error.message]);
    }
};
