import express from 'express';

import AdminController from '../controller/admin/adminController.js';
import UserValidation from '../validations/middleware/UserValidation.js';

const admin = new AdminController();
const validation = new UserValidation();
const router = express.Router();

router.post('/invite', validation.inviteRequest, admin.invite); // take name, email, number_of_days

export default router;
