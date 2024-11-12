import Comment from '../models/commentModel.js';
import mongoose from 'mongoose';
import createNotification from '../helpers/createNotification.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import Masterclass from '../models/masterClassModel.js';

// Create a new comment
export const createComment = async (req, res) => {
    const { content, post_type, postId } = req.body;
    const commentor = req.user.id;
    var postUserId = "";
    if (post_type == "masterclass") {
        const response = await Masterclass.findById(postId);
        console.log(response);
        postUserId = response._id.toString();
    }
    // can get the post id by finding them from db. but currently only masterclass is done 
    try {
        const newComment = new Comment({
            commentor: commentor,
            content,
            post_type,
            post: postId
        });

        await newComment.save();

        if(commentor != postUserId) {
            const notification = await createNotification(
                postUserId,
                'POST_ENGAGEMENT',
                `${req.user.name} commented on your post`,
                null,
                commentor
            );
            console.log(notification)
        }

        return res.json(new ApiResponse(200, null, "Comment posted successfully!"));
    } catch (error) {
        console.log(error)
        return res.json(new ApiError(400, 'Error creating comment', error));
    }
};

// Get all comments for a specific post
export const getCommentsByPost = async (req, res) => {
    const { postId, postType } = req.body;

    try {
        const comments = await Comment.find({ post: postId, post_type: postType })
            .populate('commentor', 'name');

        return res.json(new ApiResponse(200, comments, "Comments fetched successfully!"));
    } catch (error) {
        return res.json(new ApiError(404, 'Error fetching comments', error));
    }
};

// Update a comment by ID
export const updateComment = async (req, res) => {
    const { content, commentId } = req.body;
    const loggedInUserId = req.user.id;

    try {
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(200).json(new ApiResponse(400, null,'Comment not found'));
        }

        if (comment.commentor.toString() !== loggedInUserId) {
            return res.status(200).json(new ApiResponse(400,null,'Unauthorized: You can only edit your own comment'));
        }

        comment.content = content;
        await comment.save();

        return res.json(new ApiResponse(200, comment, "Comment updated successfully!"));
    } catch (error) {
        return res.json(new ApiError(400, 'Error updating comment', error));
    }
};

// Delete a comment by ID
export const deleteComment = async (req, res) => {
    const { commentId } = req.body;
    const loggedInUserId = req.user.id;

    try {
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(200).json(new ApiResponse(400,null,'Comment not found'));
        }

        if (comment.commentor.toString() !== loggedInUserId) {
            return res.status(200).json(new ApiResponse(400,null,'Unauthorized: You can only edit your own comment'));
        }

        await Comment.deleteOne({ _id: commentId });

        return res.json(new ApiResponse(200, null, "Comment deleted successfully!"));
    } catch (error) {
        console.log(error)
        return res.json(new ApiError(400, 'Error deleting comment', error));
    }
};
