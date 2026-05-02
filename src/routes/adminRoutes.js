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

//dashboard routes
router.get('/dashboard', admin.dashboard);

router.post('/invite', userValidation.inviteRequest, admin.invite); // take name, email, number_of_days
router.post('/users', admin.fetchUsers);
router.delete('/users', admin.deleteUser);
router.patch('/user', admin.changeStatus);

//movie routes
router.post('/movie', contentValidation.addMovieRequest, admin.addMovie); // take imdb, description, poster_link, base_url, total_chunks, total_size, mime_type
router.post('/fetch-movie', admin.fetchMovie); // search query, filter data, pagination data
router.put('/movie', contentValidation.editMovieRequest, admin.editMovie); // take contentId, imdb, description, poster_link, base_url, total_chunks, total_size, mime_type

//series routes
router.post('/series', contentValidation.addSeriesRequest, admin.addSeries); // imdb link, poster url, array of seasons
router.post('/fetch-series', admin.fetchSeries);
router.put('/series', contentValidation.editSeriesRequest, admin.editSeries);

router.delete('/content', admin.deleteMovie); // take only contentId in body


export default router;
