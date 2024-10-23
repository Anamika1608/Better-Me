import express from 'express';
const router = express.Router();
import { authenticate } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/multerMiddleware.js';

import { verifyExpertNumber , verifyExpertEmail , postMasterclass , updateExpertProfile} from '../controllers/expertController.js';

import { registerUserWithNumber , forgetPassword , resetPassword , registerUserWithMail , logout , loginUserWithMail , loginUserWithNumber} from '../controllers/userController.js';
  
router.post("/post-masterclass" , authenticate ,upload.single('video') , postMasterclass)

router.post("/register-email", upload.single('file'), registerUserWithMail);

router.post("/register-number", upload.single('file'), registerUserWithNumber);

router.post("/auth/verify/number", verifyExpertNumber);

router.get("/auth/logout", logout);

router.post("/auth/login-email", loginUserWithMail);

router.post("/auth/login-number", loginUserWithNumber);

router.post("/verify-expert-email", verifyExpertEmail)

router.post("/auth/forgot-password", forgetPassword);

router.post("/auth/reset-password", resetPassword)

router.post("/me/profile", authenticate, updateExpertProfile)

export default router;