import Post from '../models/Post.js';
import SuperAdmin from '../models/superAdmin.js';
import Artist from '../models/artistModel.js'
import Employee from '../models/employeeModel.js'
import Expert from '../models/expertModel.js';
import User from '../models/userModel.js'
import ApiResponse from '../utils/ApiResponse.js';

export const createPost = async (req, res) => {
    try {
        const { content, pictures, role } = req.body;
        const userId = req.user.id;

        if (!content?.trim()) {
            return res.status(400).json(new ApiResponse(400, "Content is required."));
        }

        let user;
        if (role === 'artist') {
            user = await Artist.findOne({ user: userId });
        } else if (role === 'expert') {
            user = await Expert.findOne({ user: userId });
        } else if (role === 'superAdmin') {
            user = await SuperAdmin.findOne({ user: userId });
        } else if (role === 'user') {
            user = await User.findById(userId);
        } else if (role === 'employee') {
            user = await Employee.findOne({ user: userId });
        }

        if (!user) {
            return res.status(404).json(new ApiResponse(404, `User with role ${role} not found.`));
        }

        const post = new Post({
            content,
            postedBy: user._id,
            pictures: pictures || [],
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
        const posts = await Post.find().populate('postedBy', 'name role'); // Assuming `User` has `name` and `role`
        return res.status(200).json(new ApiResponse(200, "Posts fetched successfully", posts));
    } catch (error) {
        console.error("Error fetching posts:", error);
        return res.status(500).json(new ApiResponse(500, "Error fetching posts", error));
    }
};

export const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id).populate('postedBy', 'name role');

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
        const { id } = req.params;
        const { content, pictures } = req.body;

        const updatedPost = await Post.findByIdAndUpdate(
            id,
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
        const { id } = req.params;

        const deletedPost = await Post.findByIdAndDelete(id);

        if (!deletedPost) {
            return res.status(404).json(new ApiResponse(404, "Post not found"));
        }

        return res.status(200).json(new ApiResponse(200, "Post deleted successfully", deletedPost));
    } catch (error) {
        console.error("Error deleting post:", error);
        return res.status(500).json(new ApiResponse(500, "Error deleting post", error));
    }
};
