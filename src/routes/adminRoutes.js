import express from 'express';

import AdminController from '../controller/admin/AdminController.js';
import AuthController from '../controller/admin/AuthController.js';
import UserValidation from '../validations/middleware/UserValidation.js';

const admin = new AdminController();
const auth = new AuthController();
const validation = new UserValidation();
const router = express.Router();

router.post('/invite', validation.inviteRequest, admin.invite); // take name, email, number_of_days

export default router;
