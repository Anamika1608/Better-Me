import express from 'express';
const router = express.Router();

import {createComment , getCommentsByPost ,  updateComment , deleteComment} from '../controllers/commentController.js';

import { authenticate } from '../middlewares/authMiddleware.js';

router.post('/create', authenticate , createComment);

router.post('/showAll', getCommentsByPost);

router.post('/edit', authenticate , updateComment);

router.post('/delete', authenticate ,  deleteComment);

export default router