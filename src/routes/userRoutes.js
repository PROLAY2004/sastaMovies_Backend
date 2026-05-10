import express from 'express';

import DashboardController from '../controller/user/DashboardController.js';

const router = express.Router();
const dashboard = new DashboardController();

router.get('/account', dashboard.fetchProfile);
export default router;
