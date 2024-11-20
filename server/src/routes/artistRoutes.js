import express from 'express';
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct, filterByCategory } from '../controllers/productController.js';
import { verifyExpertNumber , verifyExpertEmail  } from '../controllers/expertController.js';

import { registerUserWithNumber , forgetPassword , resetPassword , registerUserWithMail , logout , loginUserWithMail , loginUserWithNumber} from '../controllers/userController.js';
const router = express.Router();
import { upload } from '../middlewares/multerMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
const uploadFields = upload.array('productImages', 4);

// CRUD of Artist 

router.post("/register-email", upload.single('file'), registerUserWithMail);

router.post("/register-number", upload.single('file'), registerUserWithNumber);

router.post("/auth/verify/number", verifyExpertNumber);

router.get("/auth/logout", logout);

router.post("/auth/login-email", loginUserWithMail);

router.post("/auth/login-number", loginUserWithNumber);

router.post("/auth/verify/email", verifyExpertEmail)

router.post("/auth/forgot-password", forgetPassword);

router.post("/auth/reset-password", resetPassword)

// CRUD of Products of Artist 
router.post('/createProduct',authenticate, uploadFields,  createProduct);

router.get('/allProducts',authenticate, getProducts);

router.get('/getProduct/:id', getProductById);

router.put('/updateProduct/:id',authenticate, updateProduct);

router.delete('/deleteProduct/:id',authenticate, deleteProduct);

router.get('/filterByCategory' , filterByCategory)
export default router;