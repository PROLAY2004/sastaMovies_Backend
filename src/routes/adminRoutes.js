import express from 'express';

import AdminController from '../controller/admin/AdminController.js';
import AuthController from '../controller/admin/AuthController.js';
import UserValidation from '../validations/middleware/UserValidation.js';
import ContentValidation from '../validations/middleware/ContentValidation.js';

const admin = new AdminController();
const auth = new AuthController();
const userValidation = new UserValidation();
const contentValidation = new ContentValidation();
const router = express.Router();

router.post('/invite', userValidation.inviteRequest, admin.invite); // take name, email, number_of_days
router.post('/add-movie', contentValidation.addMovieRequest, admin.addMovie); // take name, description, release_date, genre

export default router;
