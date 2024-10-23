import mongoose from "mongoose";

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String, 
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  publishStatus: {
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
    required: true,
  },
  tags: {
    type: [String], 
  },
});


const Article = mongoose.model("Article", articleSchema);
export default Article;
