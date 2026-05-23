import express from 'express';

import UserController from '../controller/user/UserController.js';
import DashboardController from '../controller/user/DashboardController.js';
import TokenValidation from '../validations/middleware/TokenValidation.js';

const router = express.Router();
const tokenValidator = new TokenValidation();
const dashboard = new DashboardController();
const user = new UserController();

router.get('/me', tokenValidator.accessTokenValidator, user.getUser);

router.get('/account', tokenValidator.accessTokenValidator, dashboard.fetchProfile);
router.get('/watch-later/:contentId', tokenValidator.accessTokenValidator, user.setContent);
router.get('/remove-all', tokenValidator.accessTokenValidator, dashboard.removeAll);
router.patch('/edit', tokenValidator.accessTokenValidator, dashboard.editProfile);
router.post('/fetch-player', tokenValidator.accessTokenValidator, user.player);

router.get('/stream/:contentId', user.fetchContentDetails);
router.get('/home', user.home);
export default router;
