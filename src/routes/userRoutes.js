import express from 'express';
import AuthController from '../controller/user/authController.js';

const router = express.Router();
const auth = new AuthController();

router.post('/signin', auth.signin); //  email
router.post('/signin/:email', auth.verify); //  otp


export default router;
