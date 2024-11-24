import Post from '../models/postModel.js';
import SuperAdmin from '../models/superAdmin.js';
import Artist from '../models/artistModel.js'
import Employee from '../models/employeeModel.js'
import Expert from '../models/expertModel.js';
import User from '../models/userModel.js'
import { ApiResponse } from '../utils/ApiResponse.js';
import uploadOnCloudinary from '../utils/cloudinary.js';

export const createPost = async (req, res) => {
    try {
        const files = req.files;
        const { content } = req.body;
        const userId = req.user.id;

        const uploadedFiles = [];

        if (files.length != 0) {
            for (const file of files) {
                const result = await uploadOnCloudinary(file.path);
                console.log(result);
                uploadedFiles.push(result.secure_url);
            }
        }

        console.log(userId)

        if (!content?.trim()) {
            return res.status(400).json(new ApiResponse(400, "Content is required."));
        }

        // let user;
        // if (role === 'artist') {
        //     user = await Artist.findOne({ user: userId });
        // } else if (role === 'expert') {
        //     user = await Expert.findOne({ user: userId });
        // } else if (role === 'superAdmin') {
        //     user = await SuperAdmin.findOne({ user: userId });
        // } else if (role === 'user') {
        //     user = await User.findById(userId);
        // } else if (role === 'employee') {
        //     user = await Employee.findOne({ user: userId });
        // }

        // if (!user) {
        //     return res.status(404).json(new ApiResponse(404, `User with role ${role} not found.`));
        // }

        const post = new Post({
            content,
            postedBy: userId,
            pictures: uploadedFiles,
        });

        await post.save();

        return res.status(201).json(new ApiResponse(201, "Post created successfully", post));
    } catch (error) {
        console.error("Error creating post:", error);
        return res.status(500).json(new ApiResponse(500, "Error creating post", error));
    }
};

export const getPosts = async (req, res) => {
    try {
        const posts = await Post.find().populate('postedBy', 'name role');
        return res.status(200).json(new ApiResponse(200, "Posts fetched successfully", posts));
    } catch (error) {
        console.error("Error fetching posts:", error);
        return res.status(500).json(new ApiResponse(500, "Error fetching posts", error));
    }
};

export const getPostsByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        console.log(userId);

        const posts = await Post.find({ postedBy: userId }).populate('postedBy', 'name email');

        if (!posts || posts.length === 0) {
            return res.status(404).json(new ApiResponse(404, "No posts found for this user"));
        }

        return res.status(200).json(new ApiResponse(200, "Posts retrieved successfully", { posts }));
    } catch (error) {
        console.error("Error retrieving posts by user:", error);
        return res.status(500).json(new ApiResponse(500, "Error retrieving posts", error));
    }
};

export const getPostById = async (req, res) => {
    try {
        const { postId } = req.params;
        console.log(postId)
        const post = await Post.findById(postId).populate('postedBy', 'name role');

        if (!post) {
            return res.status(404).json(new ApiResponse(404, "Post not found"));
        }

        return res.status(200).json(new ApiResponse(200, "Post fetched successfully", post));
    } catch (error) {
        console.error("Error fetching post:", error);
        return res.status(500).json(new ApiResponse(500, "Error fetching post", error));
    }
};

export const updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, pictures } = req.body;

        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { content, pictures },
            { new: true, runValidators: true }
        );

        if (!updatedPost) {
            return res.status(404).json(new ApiResponse(404, "Post not found"));
        }

        return res.status(200).json(new ApiResponse(200, "Post updated successfully", updatedPost));
    } catch (error) {
        console.error("Error updating post:", error);
        return res.status(500).json(new ApiResponse(500, "Error updating post", error));
    }
};

export const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;

        const deletedPost = await Post.findByIdAndDelete(postId);

        if (!deletedPost) {
            return res.status(404).json(new ApiResponse(404, "Post not found"));
        }

        return res.status(200).json(new ApiResponse(200, "Post deleted successfully", deletedPost));
    } catch (error) {
        console.error("Error deleting post:", error);
        return res.status(500).json(new ApiResponse(500, "Error deleting post", error));
    }
};

export const likePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json(new ApiResponse(404, "Post not found"));
        }

        const alreadyLiked = post.likes.some((like) => like.likedBy.toString() === userId);

        if (alreadyLiked) {
            return res.status(400).json(new ApiResponse(400, "User has already liked this post"));
        }

        post.likes.push({ count: 1, likedBy: userId });
        await post.save();

        return res.status(200).json(new ApiResponse(200, "Post liked successfully", post));
    } catch (error) {
        console.error("Error liking post:", error);
        return res.status(500).json(new ApiResponse(500, "Error liking post", error));
    }
};

export const unlikePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json(new ApiResponse(404, "Post not found"));
        }

        const likeIndex = post.likes.findIndex((like) => like.likedBy.toString() === userId);

        if (likeIndex === -1) {
            return res.status(400).json(new ApiResponse(400, "User has not liked this post"));
        }

        post.likes.splice(likeIndex, 1);
        await post.save();

        return res.status(200).json(new ApiResponse(200, "Post unliked successfully", post));
    } catch (error) {
        console.error("Error unliking post:", error);
        return res.status(500).json(new ApiResponse(500, "Error unliking post", error));
    }
};

export const getLikesCount = async (req, res) => {
    try {
        const { postId } = req.params;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json(new ApiResponse(404, "Post not found"));
        }

        const likesCount = post.likes.length;

        return res.status(200).json(new ApiResponse(200, "Likes count retrieved successfully", { likesCount }));
    } catch (error) {
        console.error("Error retrieving likes count:", error);
        return res.status(500).json(new ApiResponse(500, "Error retrieving likes count", error));
    }
};

export const getUsersWhoLiked = async (req, res) => {
    try {
        const { postId } = req.params;

        const post = await Post.findById(postId).populate('likes.likedBy', 'name email');

        if (!post) {
            return res.status(404).json(new ApiResponse(404, "Post not found"));
        }

        const users = post.likes.map((like) => like.likedBy);

        return res.status(200).json(new ApiResponse(200, "Users who liked the post retrieved successfully", { users }));
    } catch (error) {
        console.error("Error retrieving users who liked the post:", error);
        return res.status(500).json(new ApiResponse(500, "Error retrieving users who liked the post", error));
    }
};
0