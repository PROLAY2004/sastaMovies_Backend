import express from 'express';

import AdminController from '../controller/admin/authController.js';
import UserValidation from '../validations/middleware/UserValidation.js';

const admin = new AdminController();
const validation = new UserValidation();
const router = express.Router();

router.post('/signup', validation.signupRequest, admin.signup); // take name, email, future_date

export default router;
