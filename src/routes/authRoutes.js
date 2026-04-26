import express from 'express';

import AuthController from '../controller/user/authController.js';
import AuthControllerAdmin from '../controller/admin/authController.js';
import UserController from '../controller/user/UserController.js';

const router = express.Router();
const userAuth = new AuthController();
const adminAuth = new AuthControllerAdmin();

router.post('/signin', userAuth.signin); //  email in body
router.post('/signin/:email', userAuth.verify); //  otp in body and email in params
router.get('/google', userAuth.google); // take code in query

router.post('/admin/signin', adminAuth.signin); //  email in body
router.post('/admin/signin/:email', adminAuth.verify); //  otp in body and email in params
router.get('/admin/google', adminAuth.google); // take code in query

export default router;
