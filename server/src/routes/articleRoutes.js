import express from "express";
import {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
} from "../controllers/articleController.js";
import { authenticate } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.post("/create", authenticate,createArticle);

router.get("/getAllArticles", authenticate,getArticles);

router.get("/getArticle/:id", authenticate,getArticleById);

router.put("/update/:id", authenticate,updateArticle);

router.delete("/delete/:id", authenticate,deleteArticle);

export default router;
