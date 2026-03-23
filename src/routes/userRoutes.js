import express from 'express';
import AuthController from '../controller/user/authController.js';

const router = express.Router();
const auth = new AuthController();

router.post('/signin', auth.signin); //  email in body
router.post('/signin/:email', auth.verify); //  otp in body and email in params
router.get('/google', auth.google); // take code in query


export default router;
