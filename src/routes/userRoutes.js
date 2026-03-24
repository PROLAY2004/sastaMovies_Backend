import express from 'express';

import AuthController from '../controller/user/authController.js';
import UserController from '../controller/user/UserController.js';
import TokenValidation from '../validations/middleware/TokenValidation.js';

const router = express.Router();
const auth = new AuthController();
const profile = new UserController();
const validator = new TokenValidation();

router.post('/auth/signin', auth.signin); //  email in body
router.post('/auth/signin/:email', auth.verify); //  otp in body and email in params
router.get('/auth/google', auth.google); // take code in query

router.get(
  '/account/dashboard',
  validator.accessTokenValidator,
  profile.dashboard
);
export default router;
