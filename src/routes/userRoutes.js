import express from 'express';

import UserController from '../controller/user/UserController.js';

const router = express.Router();
const profile = new UserController();

router.get('/account/dashboard', profile.dashboard);
export default router;
