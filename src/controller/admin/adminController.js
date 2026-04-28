import axios from 'axios';

import user from '../../models/userModel.js';
import content from '../../models/contentModel.js';
import bucket from '../../models/bucketModel.js';
import DateFormatter from '../../utils/DateFormatter.js';
import SendEmailService from '../../services/sendMailService.js';
import configuration from '../../config/config.js';

const mailer = new SendEmailService();
const format = new DateFormatter();

export default class AdminController {
  invite = async (req, res, next) => {
    try {
      const { name, email, days } = req.body;
      const validTill = new Date();
      const isUser = await user.findOne({ email });

      if (isUser) {
        res.status(400);

        throw new Error('Email already exists.');
      }

      validTill.setDate(validTill.getDate() + days);
      const newUser = new user({ name, email, validTill });
      await newUser.save();

      mailer.activationMailer(
        name,
        email,
        format.dateAndTimeTemplate(Date.now()),
        format.dateTemplate(validTill)
      );

      res.status(200).json({
        message: 'Invitation sent successfully.',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  addMovie = async (req, res, next) => {
    try {
      const {
        imdbLink,
        posterLink,
        baseUrl,
        totalChunks,
        totalSize,
        mimeType,
        subtitleLink,
      } = req.body;
      const imdbId = imdbLink.split('/title/')[1].split('/')[0];
      const imdbApi = `https://www.omdbapi.com/?i=${imdbId}&apikey=${configuration.IMDB_API_KEY}`;
      const response = await axios.get(imdbApi);
      const isExists = await content.findOne({ imdbId, isDeleted: false });

      if (isExists) {
        res.status(400);
        throw new Error('Movie already exists.');
      }

      const bucketInstance = await bucket.create({
        imdbId,
        baseUrl,
        chunkCount: totalChunks,
        size_kb: totalSize,
        mimeType: mimeType.toLowerCase(),
      });

      await content.create({
        imdbId,
        title: response.data.Title,
        description: response.data.Plot,
        release: response.data.Released,
        cast: response.data.Actors.split(', '),
        runtime: response.data.Runtime,
        rating: parseFloat(response.data.imdbRating),
        genre: response.data.Genre.split(', '),
        posterUrl: {
          horizontal: posterLink,
          vertical: response.data.Poster,
        },
        contentType: 'movie',
        subtitleUrl: subtitleLink,
        contentIds: [bucketInstance._id],
      });

      res.status(200).json({
        message: 'Movie added successfully.',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  // fetchMovie Controller
  fetchMovie = async (req, res, next) => {
    try {
      // 1. Extract query elements from req.body with default fallbacks
      const {
        search = '',
        genre = 'all',
        year = 'all',
        page = 1,
        limit = 5,
      } = req.body;

      const query = { contentType: 'movie', isDeleted: false };

      // 2. Apply Search Filter (Case-insensitive)
      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }

      // 3. Apply Genre Filter
      if (genre && genre !== 'all') {
        query.genre = genre;
      }

      // 4. Apply Year Filter
      if (year && year !== 'all') {
        // Assuming 'release' is stored as a date string containing the year
        query.release = { $regex: year.toString(), $options: 'i' };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // 5. Run queries in parallel for the fastest possible response time
      const [movies, totalCount, rawGenres, releaseDates] = await Promise.all([
        content
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        content.countDocuments(query),
        content.distinct('genre', { contentType: 'movie', isDeleted: false }), // Fast way to get all genres
        content
          .find({ contentType: 'movie', isDeleted: false })
          .select('release')
          .lean(), // Get dates to extract years
      ]);

      // 6. Format unique years for the dropdown
      const allYears = [
        ...new Set(
          releaseDates
            .filter((m) => m.release)
            .map((m) => new Date(m.release).getFullYear())
        ),
      ].sort((a, b) => b - a); // Sort newest to oldest

      // 7. Format unique genres
      const allGenres = [...new Set(rawGenres.flat())];

      res.status(200).json({
        message: 'Movie details fetched successfully.',
        success: true,
        data: {
          movies,
          allGenres,
          allYears,
          totalPages: Math.ceil(totalCount / parseInt(limit)) || 1,
          currentPage: parseInt(page),
          totalMovies: totalCount,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
