import express from 'express';

import AdminController from '../controller/admin/AdminController.js';
import AuthController from '../controller/admin/AuthController.js';
import MoviesController from '../controller/admin/MoviesController.js';
import SeriesController from '../controller/admin/SeriesController.js';
import UserController from '../controller/admin/UserController.js';
import AdminManagementController from '../controller/admin/AdminManagementController.js';

import UserValidation from '../validations/middleware/UserValidation.js';
import ContentValidation from '../validations/middleware/ContentValidation.js';
import AccessValidation from '../validations/middleware/AccessValidation.js';
import isSuperAdmin from '../validations/middleware/checkSuperAdmin.js';

const admin = new AdminController();
const auth = new AuthController();
const movie = new MoviesController();
const series = new SeriesController();
const user = new UserController();
const manage = new AdminManagementController();

const access = new AccessValidation();
const userValidation = new UserValidation();
const contentValidation = new ContentValidation();

const router = express.Router();

//dashboard routes
router.get('/dashboard', admin.dashboard);
router.post('/activity', admin.fetchActivity);
router.post('/export', admin.exportLogs);

//user routes
router.post(
  '/invite',
  access.userAccess,
  userValidation.inviteRequest,
  user.invite
); // take name, email, number_of_days
router.post('/users', user.fetchUsers);
router.delete('/users', access.userAccess, user.deleteUser);
router.patch('/users', access.userAccess, user.changeStatus);
router.put('/users', access.userAccess, user.renewUser);
router.post('/upgrade', access.userAccess, isSuperAdmin, user.makeAdmin);

//admin management routes
router.post('/fetchAdmins', isSuperAdmin, manage.fetchAdmins);
router.put('/permissions', isSuperAdmin, manage.updatePermissions);
router.post('/downgrade', isSuperAdmin, manage.downgradeAdmin);
router.delete('/delete', isSuperAdmin, manage.deleteAdmin);
router.patch('/status', isSuperAdmin, manage.changeStatus);
router.post('/add', isSuperAdmin, manage.addAdmin);

//movie routes
router.post(
  '/movie',
  access.movieAccess,
  contentValidation.addMovieRequest,
  movie.addMovie
); // take imdb, description, poster_link, base_url, total_chunks, total_size, mime_type
router.post('/fetch-movie', movie.fetchMovie); // search query, filter data, pagination data
router.put(
  '/movie',
  access.movieAccess,
  contentValidation.editMovieRequest,
  movie.editMovie
); // take contentId, imdb, description, poster_link, base_url, total_chunks, total_size, mime_type

//series routes
router.post(
  '/series',
  access.seriesAccess,
  contentValidation.addSeriesRequest,
  series.addSeries
); // imdb link, poster url, array of seasons
router.post('/fetch-series', series.fetchSeries);
router.put(
  '/series',
  access.seriesAccess,
  contentValidation.editSeriesRequest,
  series.editSeries
);

router.delete('/content', access.deleteContentAccess, admin.deleteContent); // take only contentId in body

export default router;
