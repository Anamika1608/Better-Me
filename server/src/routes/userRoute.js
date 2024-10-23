import express from 'express';
const router = express.Router();

import { registerUserWithMail, registerUserWithNumber , verifyUserNumber, updateUserProfile, loginUserWithMail, loginUserWithNumber, logout, forgetPassword, verifyUserEmail , resetPassword} from '../controllers/userController.js';

import { authenticate } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/multerMiddleware.js'
 
router.post("/register-email", upload.single('file'), registerUserWithMail);

router.post("/register-number", upload.single('file'), registerUserWithNumber);

router.post("/auth/verify/number", verifyUserNumber);

router.post("/auth/verify/email", verifyUserEmail)

router.get("/auth/logout", logout);

router.post("/auth/login-email", loginUserWithMail);

router.post("/auth/login-number", loginUserWithNumber);

router.post("/auth/forgot-password", forgetPassword);

router.post("/auth/reset-password", resetPassword)

router.post("/me/profile", authenticate, updateUserProfile)



export default router;
