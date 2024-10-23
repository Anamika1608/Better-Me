import Article from "../models/articleModel.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

// Create Article
export const createArticle = async (req, res) => {
  try {
    const { title, content, publishStatus, category, tags } = req.body;

    if ([title, content, category].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "Title, content, and category are required.");
    }

    const article = new Article({
      title,
      content, // Store rich text content (can be HTML from the editor)
      publishStatus: publishStatus || false,
      category,
      tags: tags ? tags.split(",") : [], // Assuming tags are sent as a comma-separated string
    });

    await article.save();

    return res
      .status(201)
      .json(new ApiResponse(201, "Article created successfully", article));
  } catch (error) {
    console.error("Error creating article:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Error creating article", error));
  }
};

// Get All Articles
export const getArticles = async (req, res) => {
  try {
    const articles = await Article.find();
    return res
      .status(200)
      .json(new ApiResponse(200, "Articles fetched successfully", articles));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Error fetching articles", error));
  }
};

// Get Article by ID
export const getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json(new ApiError(404, "Article not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Article fetched successfully", article));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Error fetching article", error));
  }
};

// Update Article
export const updateArticle = async (req, res) => {
  try {
    const { title, content, publishStatus, category, tags } = req.body;

    const updatedArticle = await Article.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        publishStatus,
        category,
        tags: tags ? tags.split(",") : [],
      },
      { new: true }
    );

    if (!updatedArticle) {
      return res.status(404).json(new ApiError(404, "Article not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Article updated successfully", updatedArticle));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Error updating article", error));
  }
};

// Delete Article
export const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) {
      return res.status(404).json(new ApiError(404, "Article not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Article deleted successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Error deleting article", error));
  }
};
