import Product from "../models/productModel.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

export const createProduct = async (req, res) => {
  try {
    const files = req.files;
    const uploadedFiles = [];

    if (files.length === 0) {
      return res.status(400).json(new ApiError(400, "At least one product image is required."));
    }

    // Upload each file to Cloudinary (or another service) and collect the URLs
    for (const file of files) {
      const result = await uploadOnCloudinary(file.path);
      uploadedFiles.push(result.secure_url);
    }

    // Step 2: Extract other form data from req.body
    const {
      title,
      shortDescription,
      description,
      price,
      inStock,
      product_id,
      category,
    } = req.body;
    if (
      [
        title,
        shortDescription,
        description,
        price,
        inStock,
        product_id,
        category,
      ].some((field) => field?.trim() === "")
    ) {
      throw new ApiError(400, "All Field are Required!");
    }

    const product = new Product({
      title,
      shortDescription,
      description,
      price,
      inStock,
      product_id,
      category,
      pictures: uploadedFiles, // Store the uploaded URLs in 'pictures'
    });

    await product.save();

    // Step 4: Send a success response
    return res
      .status(201)
      .json(new ApiResponse(201, "Product created successfully", product));
  } catch (error) {
    console.error("Error creating product:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Error creating product", error));
  }
};

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    return res
      .status(200)
      .json(new ApiResponse(200, "Products fetched successfully", products));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Error fetching products", error));
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json(new ApiError(404, "Product not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Product fetched successfully", product));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Error fetching product", error));
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product) {
      return res.status(404).json(new ApiError(404, "Product not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Product updated successfully", product));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Error updating product", error));
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json(new ApiError(404, "Product not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Product deleted successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Error deleting product", error));
  }
};

export const filterByCategory = async (req, res) => {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ error: "Please provide the category." });
    }

    const products = await Product.find({ category: category });

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found in this category." });
    }

    return res.status(200).json({ products });

  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error fetching products", details: error.message });
  }
};
