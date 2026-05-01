import user from '../../models/userModel.js';
import content from '../../models/contentModel.js';
import bucket from '../../models/bucketModel.js';
import DateFormatter from '../../utils/DateFormatter.js';
import SendEmailService from '../../services/sendMailService.js';
import FetchContent from '../../utils/FetchContent.js';

const mailer = new SendEmailService();
const format = new DateFormatter();
const imdbFetch = new FetchContent();

export default class AdminController {
  dashboard = async (req, res, next) => {
    try {
      // Run all independent database queries in parallel for maximum speed
      const [userCount, contents, movieCount, seriesCount] = await Promise.all([
        user.countDocuments({
          isBlocked: false,
          validTill: { $gt: Date.now() },
          role: 'user',
        }),
        content
          .find({ isDeleted: false })
          .sort({ createdAt: -1 })
          .limit(4)
          .lean(), // Converts heavy Mongoose docs to fast, plain JS objects
        content.countDocuments({
          isDeleted: false,
          contentType: 'movie',
        }),
        content.countDocuments({
          isDeleted: false,
          contentType: 'series',
        }),
      ]);

      res.status(200).json({
        message: 'Dashboard data fetched successfully.',
        success: true,
        data: {
          contents,
          userCount,
          movieCount,
          seriesCount,
        },
      });
    } catch (err) {
      next(err);
    }
  };

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
      const response = await imdbFetch.fetchMovie(req.body.imdbLink);
      const isExists = await content.findOne({
        imdbId: response.imdbId,
        isDeleted: false,
      });

      if (isExists) {
        res.status(400);
        throw new Error('Movie already exists.');
      }

      const bucketInstance = await bucket.create({
        imdbId: response.imdbId || '',
        baseUrl: req.body.baseUrl,
        chunkCount: req.body.totalChunks,
        size_byte: req.body.totalSize,
        subtitleUrl: req.body.subtitleLink,
        mimeType: req.body.mimeType.toLowerCase(),
      });

      await content.create({
        imdbId: response.imdbId || '',
        title: response.movieData.data.Title || '',
        description: response.movieData.data.Plot || '',
        release: response.movieData.data.Released || '',
        cast: response.movieData.data.Actors.split(', ') || '',
        runtime: response.movieData.data.Runtime || '0 min',
        rating: parseFloat(response.movieData.data.imdbRating) || 0,
        genre: response.movieData.data.Genre.split(', ') || '',
        posterUrl: {
          horizontal: req.body.posterLink,
          vertical: response.movieData.data.Poster || '',
        },
        contentType: 'movie',
        contentIds: [[bucketInstance._id]],
      });

      res.status(200).json({
        message: 'Movie added successfully.',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
        const safeSearch = this.escapeRegex(search); // Escape the special characters first
        query.title = { $regex: safeSearch, $options: 'i' };
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

      const bucketIds = movies
        .map((movie) => movie.contentIds?.[0]?.[0])
        .filter((id) => id); // Filter out any undefined/null values

      // Fetch all corresponding buckets in one go
      // (Make sure your bucket model is imported at the top, e.g., const Bucket = require('../models/Bucket');)
      const buckets = await bucket.find({ _id: { $in: bucketIds } }).lean();

      // Create a dictionary map for fast lookup by bucket _id
      const bucketMap = buckets.reduce((acc, bucket) => {
        acc[bucket._id.toString()] = bucket;
        return acc;
      }, {});

      // Merge both objects: movie = {...bucketData, ...movieData}
      const mergedMovies = movies.map((movie) => {
        const targetBucketId = movie.contentIds?.[0]?.[0]
          ? movie.contentIds[0][0].toString()
          : null;
        const bucketData = targetBucketId ? bucketMap[targetBucketId] : {};

        return {
          ...bucketData, // Spreads bucket fields
          ...movie, // Spreads movie fields (movie fields will override bucket fields if there's a conflict, like _id)
          subtitleUrl: bucketData.subtitleUrl || movie.subtitleUrl || '',
        };
      });

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
          movies: mergedMovies,
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

  editMovie = async (req, res, next) => {
    try {
      const response = await imdbFetch.fetchMovie(req.body.imdbLink);
      const isExists = await content.findOne({
        imdbId: response.imdbId,
        _id: { $ne: req.body.contentId }, // Exclude the current movie being edited
        isDeleted: false,
      });

      if (isExists) {
        res.status(400);
        throw new Error('Another movie with this IMDB ID already exists.');
      }

      const updatedContent = await content.findByIdAndUpdate(
        { _id: req.body.contentId },
        {
          imdbId: response.imdbId || '',
          title: response.movieData.data.Title || '',
          description: response.movieData.data.Plot || '',
          release: response.movieData.data.Released || '',
          cast: response.movieData.data.Actors.split(', ') || '',
          runtime: response.movieData.data.Runtime || '',
          rating: parseFloat(response.movieData.data.imdbRating) || 0,
          genre: response.movieData.data.Genre.split(', ') || '',
          posterUrl: {
            horizontal: req.body.posterLink,
            vertical: response.movieData.data.Poster || '',
          },
        },
        { new: true } // Returns the updated document
      );

      // Safety check in case the contentId passed doesn't exist
      if (!updatedContent) {
        res.status(404);
        throw new Error('Movie not found.');
      }

      await bucket.findByIdAndUpdate(
        { _id: updatedContent.contentIds[0] },
        {
          imdbId: response.imdbId || '',
          baseUrl: req.body.baseUrl,
          chunkCount: req.body.totalChunks,
          size_byte: req.body.totalSize,
          subtitleUrl: req.body.subtitleLink,
          mimeType: req.body.mimeType.toLowerCase(),
        }
      );

      res.status(200).json({
        message: 'Movie updated successfully.',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  deleteMovie = async (req, res, next) => {
    try {
      if (!req.body.contentId) {
        res.status(400);
        throw new Error('ContentId is Required');
      }

      const updatedContent = await content.findOneAndUpdate(
        { _id: req.body.contentId },
        { $set: { isDeleted: true } },
        { new: true } // Returns the modified document
      );

      if (!updatedContent) {
        res.status(400);
        throw new Error('Content not available or deleted.');
      }

      res.status(200).json({
        message: 'Movie deleted successfully',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  addSeries = async (req, res, next) => {
    try {
      const response = await imdbFetch.fetchSeries(req.body.imdbLink);
      const isExists = await content.findOne({
        imdbId: response.imdbId,
        isDeleted: false,
      });

      if (isExists) {
        res.status(400);
        throw new Error('Series already exists.');
      }

      // const bucketInstance = await bucket.create({
      //   imdbId: response.imdbId || '',
      //   baseUrl: req.body.baseUrl,
      //   chunkCount: req.body.totalChunks,
      //   size_byte: req.body.totalSize,
      //   subtitleUrl: req.body.subtitleLink,
      //   mimeType: req.body.mimeType.toLowerCase(),
      // });

      // await content.create({
      //   imdbId: response.imdbId || '',
      //   title: response.movieData.data.Title || '',
      //   description: response.movieData.data.Plot || '',
      //   release: response.movieData.data.Released || '',
      //   cast: response.movieData.data.Actors.split(', ') || '',
      //   runtime: response.movieData.data.Runtime || '0 min',
      //   rating: parseFloat(response.movieData.data.imdbRating) || 0,
      //   genre: response.movieData.data.Genre.split(', ') || '',
      //   posterUrl: {
      //     horizontal: req.body.posterLink,
      //     vertical: response.movieData.data.Poster || '',
      //   },
      //   contentType: 'movie',
      //   contentIds: [[bucketInstance._id]],
      // });
      console.log(req.body.seasons);
      

      res.status(200).json({
        message: 'Series added successfully.',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };
}
