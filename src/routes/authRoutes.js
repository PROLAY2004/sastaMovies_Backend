import express from 'express';

import AuthController from '../controller/user/AuthController.js';
import AuthControllerAdmin from '../controller/admin/authController.js';
import UserController from '../controller/user/DashboardController.js';
import TokenValidation from '../validations/middleware/TokenValidation.js';

const router = express.Router();
const userAuth = new AuthController();
const adminAuth = new AuthControllerAdmin();
const tokenValidation = new TokenValidation();

router.post('/signin', userAuth.signin); //  email in body
router.post('/signin/:email', userAuth.verify); //  otp in body and email in params
router.get('/google', userAuth.google); // take code in query
router.get('/refresh', tokenValidation.refreshTokenValidator, userAuth.refresh); // take refresh token in header

router.post('/admin/signin', adminAuth.signin); //  email in body
router.post('/admin/signin/:email', adminAuth.verify); //  otp in body and email in params
router.get('/admin/google', adminAuth.google); // take code in query
router.get('/admin/refresh', tokenValidation.refreshTokenValidator, adminAuth.refresh); // take refresh token in header


export default router;
