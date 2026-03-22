import express from 'express';
import AuthController from '../controller/user/authController.js';

const router = express.Router();
const auth = new AuthController();

router.post('/signin', auth.signin); //  email

export default router;
