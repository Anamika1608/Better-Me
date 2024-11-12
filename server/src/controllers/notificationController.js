import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';
import { io } from '../../app.js'
import ApiError from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import createNotification from '../helpers/createNotification.js';

// Send friend request
export const sendFriendReq = async (req, res) => {
    try {
        const { recipientId } = req.body;
        const notification = await createNotification(
            recipientId,
            'FRIEND_REQUEST',
            `${req.user.name} sent you a friend request`,
            null,
            req.user.id
        );
        return res.status(201).json(new ApiResponse(201, notification, "Friend request sent successfully"));
    } catch (error) {
        console.log(error)
        throw new ApiError(400, error.message);
    }
};

// Accept friend request
export const acceptFriendReq = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification || notification.type !== 'FRIEND_REQUEST') {
            return res.status(200).json(new ApiResponse(404,null, 'Friend request not found.'));
        }

        // Add friend logic
        await User.findByIdAndUpdate(req.user._id, { $addToSet: { friends: notification.sender } });
        await User.findByIdAndUpdate(notification.sender, { $addToSet: { friends: req.user._id } });

        // Notify the sender that their friend request was accepted
        await createNotification(
            notification.sender,
            'FRIEND_REQUEST_ACCEPTED',
            `${req.user.name} accepted your friend request`,
            null,
            req.user._id
        );

        await Notification.findByIdAndDelete(req.params.id);
        return res.status(200).json(new ApiResponse(200, null, "Friend request accepted"));
    } catch (error) {
        throw new ApiError(400, error.message);
    }
};

// Decline friend request
export const declineFriendReq = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);
        if (!notification || notification.type !== 'FRIEND_REQUEST') {
            return res.status(200).json(new ApiResponse(404, null, 'Friend request not found.'));
        }

        // Notify the sender that their friend request was declined
        await createNotification(
            notification.sender,
            'FRIEND_REQUEST_DECLINED',
            `${req.user.name} declined your friend request`,
            null,
            req.user._id
        );

        return res.status(200).json(new ApiResponse(200, null, "Friend request declined"));
    } catch (error) {
        throw new ApiError(400, error.message);
    }
};

// Create a new post and notify followers
export const newPost = async (req, res) => {
    try {
        const newPost = new Post(req.body);
        await newPost.save();

        const followers = await User.find({ following: req.user._id });
        await Promise.all(
            followers.map(follower => createNotification(
                follower._id,
                'NEW_POST',
                `${req.user.name} has created a new post`,
                newPost._id,
                req.user._id
            ))
        );

        return res.status(201).json(new ApiResponse(201, newPost, "Post created successfully"));
    } catch (error) {
        throw new ApiError(400, error.message);
    }
};

// Like a post
export const likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        post.likes.push(req.user._id);
        await post.save();

        // Notify the post author about the like
        await createNotification(
            post.author,
            'POST_ENGAGEMENT',
            `${req.user.name} liked your post`,
            post._id,
            req.user._id
        );

        return res.status(200).json(new ApiResponse(200, post, "Post liked successfully"));
    } catch (error) {
        throw new ApiError(400, error.message);
    }
};

// Create agency update for all users
export const agencyUpdate = async (req, res) => {
    try {
        const { content } = req.body;

        await createNotification(
            null,
            'AGENCY_UPDATE',
            content,
            null,
            req.user._id
        )

        return res.status(200).json(new ApiResponse(200, null, "Agency update sent to all users"));
    } catch (error) {
        throw new ApiError(400, error.message);
    }
};
