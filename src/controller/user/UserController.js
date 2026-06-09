import axios from 'axios';

import content from '../../models/contentModel.js';
import user from '../../models/userModel.js';
import bucket from '../../models/bucketModel.js';
import getMimeType from '../../utils/mimeFormat.js';
import contact from '../../models/contactModel.js';
import SendEmailService from '../../services/sendMailService.js';

const mailer = new SendEmailService();
export default class UserController {
  getUser = async (req, res, next) => {
    try {
      res.status(200).json({
        message: 'userDetails fetched successfully',
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  home = async (req, res, next) => {
    try {
      const [randomContent, movies, series] = await Promise.all([
        content.aggregate([
          {
            $match: {
              isDeleted: false,
            },
          },
          {
            $sample: { size: 1 },
          },
        ]),

        content
          .find({
            contentType: 'movie',
            isDeleted: false,
          })
          .limit(12)
          .sort({ createdAt: -1 }),

        content
          .find({
            contentType: 'series',
            isDeleted: false,
          })
          .limit(12)
          .sort({ createdAt: -1 }),
      ]);

      res.status(200).json({
        message: 'Details fetched successfully',
        success: true,
        data: {
          randomContent: randomContent[0],
          movies,
          series,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  setContent = async (req, res, next) => {
    try {
      let message = '';
      const contentId = req.params.contentId;
      const contentData = await content.findOne({
        _id: contentId,
        isDeleted: false,
      });

      if (!contentData) {
        res.status(400);
        throw new Error('Content does not exists or deleted');
      }

      if (req.user.savedContents.includes(contentId)) {
        const updatedUser = await user.findOneAndUpdate(
          { _id: req.user._id, isDeleted: false },
          {
            $pull: {
              savedContents: contentId,
            },
          },
          { new: true }
        );

        if (!updatedUser) {
          res.status(400);
          throw new Error('User Blocked or Deleted');
        }

        message = 'Content removed successfully';
      } else {
        const updatedUser = await user.findOneAndUpdate(
          { _id: req.user._id, isDeleted: false },
          {
            $push: {
              savedContents: contentId,
            },
          },
          { new: true }
        );

        if (!updatedUser) {
          res.status(400);
          throw new Error('User Blocked or Deleted');
        }

        message = 'Content saved successfully';
      }

      res.status(200).json({
        message,
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  player = async (req, res, next) => {
    try {
      if (!req.body.contentId) {
        res.status(400);
        throw new Error('Content Id is required');
      }

      // FIX 1: Add .lean() to return a plain JavaScript object so we can modify it
      const contentInfo = await content
        .findOne({
          _id: req.body.contentId,
          isDeleted: false,
        })
        .lean();

      if (!contentInfo) {
        res.status(404);
        throw new Error('Content not found');
      }

      // FIX 2: Initialize the outer subtitles array
      contentInfo.subtitles = [];

      for (let i = 0; i < contentInfo.contentIds.length; i++) {
        // FIX 3: Initialize the inner array for each season
        contentInfo.subtitles[i] = [];

        for (let j = 0; j < contentInfo.contentIds[i].length; j++) {
          const bucketInfo = await bucket.findOne({
            _id: contentInfo.contentIds[i][j],
          });

          // Safely assign the subtitle URL (fallback to null if no bucket or subtitle exists)
          contentInfo.subtitles[i][j] = bucketInfo?.subtitleUrl || null;
        }
      }

      res.status(200).json({
        message: 'Content info fetched successfully',
        success: true,
        data: {
          contentInfo,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  fetchContentDetails = async (req, res, next) => {
    try {
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      const range = req.headers.range;
      const contentId = req.params.contentId;

      if (!range || !contentId) {
        res.status(400);
        throw new Error('Missing required parameters');
      }

      const contentInfo = await content.findOne({
        _id: contentId,
        isDeleted: false,
      });

      if (!contentInfo) {
        res.status(404);
        throw new Error('Content not found');
      }

      // Default indices for movies
      let seasonIndex = 0;
      let episodeIndex = 0;

      // If it's a series, read the requested season and episode from the query parameters.
      // Example frontend request: /api/content/6a0c...?season=1&episode=3
      if (contentInfo.contentType === 'series') {
        seasonIndex = parseInt(req.query.season || '0', 10);
        episodeIndex = parseInt(req.query.episode || '0', 10);
      }

      // Safety check: Ensure the requested season and episode actually exist in the array
      if (
        !contentInfo.contentIds[seasonIndex] ||
        !contentInfo.contentIds[seasonIndex][episodeIndex]
      ) {
        res.status(404);
        throw new Error('Requested season or episode does not exist');
      }

      // Fetch the correct bucket dynamically
      const bucketInfo = await bucket.findOne({
        _id: contentInfo.contentIds[seasonIndex][episodeIndex],
      });

      if (!bucketInfo) {
        res.status(404);
        throw new Error('Bucket metadata not found for this content');
      }

      const contentSize = bucketInfo.size_byte;
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : contentSize - 1;

      const startChunk = Math.floor(start / chunkSize);
      const endChunk = Math.floor(end / chunkSize);

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${contentSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Type': getMimeType(bucketInfo.mimeType),
        'Content-Length': end - start + 1,
      });

      for (let i = startChunk; i <= endChunk; i++) {
        const chunkUrl = `${bucketInfo.baseUrl}${i}`;

        const chunkStart = i * chunkSize;
        const offsetStart = i === startChunk ? start - chunkStart : 0;
        const offsetEnd = i === endChunk ? end - chunkStart : chunkSize - 1;

        try {
          const response = await axios({
            method: 'GET',
            url: chunkUrl,
            responseType: 'stream',
            timeout: 15000,
            headers: {
              Range: `bytes=${offsetStart}-${offsetEnd}`,
            },
          });

          await new Promise((resolve, reject) => {
            response.data.pipe(res, { end: false });
            response.data.on('end', resolve);
            response.data.on('error', reject);
          });
        } catch (streamError) {
          console.error(`Failed to fetch ${chunkUrl}:`, streamError.message);
          if (!res.writableEnded) res.end();
          return;
        }
      }

      if (!res.writableEnded) {
        res.end();
      }
    } catch (err) {
      if (res.headersSent) {
        if (!res.writableEnded) res.end();
      } else {
        next(err);
      }
    }
  };

  contact = async (req, res, next) => {
    try {
      const { name, email, message, isSubscribed } = req.body;

      const newContact = await contact.create({
        name,
        email,
        message,
        isSubscribed,
      });

      mailer.contactMailer(name, email, message, isSubscribed);

      res.status(200).json({
        message: 'Message sent successfully',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  // Backend Controller
  movies = async (req, res, next) => {
    try {
      const { searchQuery, genre, year, rating, sortBy } = req.body;

      // 1. Base query for active movies
      let query = {
        contentType: 'movie',
        isDeleted: false,
      };

      // 2. Search Query (Auto-triggered from frontend)
      if (searchQuery) {
        query.$or = [
          { title: { $regex: searchQuery, $options: 'i' } },
          { genre: { $regex: searchQuery, $options: 'i' } },
          // Uncomment below if you have an actors array
          // { actors: { $regex: searchQuery, $options: 'i' } }
        ];
      }

      // 3. Genre Filter
      if (genre && genre !== 'all') {
        // Matches the specific genre inside the string/array
        query.genre = { $regex: genre, $options: 'i' };
      }

      // 4. Year Filter
      if (year && year !== 'all') {
        // Assuming 'release' is saved as a string containing the year
        query.release = { $regex: year, $options: 'i' };
      }

      // 5. Rating Filter
      if (rating && rating !== 'all') {
        query.rating = { $gte: Number(rating) };
      }

      // 6. Sorting Logic
      let sortOption = { createdAt: -1 }; // Default: Newest added
      if (sortBy === 'rating') sortOption = { rating: -1 };
      if (sortBy === 'title') sortOption = { title: 1 };

      // Fetch the filtered/sorted movies
      const movies = await content.find(query).sort(sortOption);

      if (sortBy === 'year') {
        movies.sort((a, b) => {
          // Slice the last 4 characters, convert to integer. Fallback to 0 if it fails.
          const yearA = parseInt(a.release?.toString().slice(-4)) || 0;
          const yearB = parseInt(b.release?.toString().slice(-4)) || 0;

          return yearB - yearA; // Descending order (Newest first)
        });
      }

      // 7. Extract Unique Dynamic Options for Dropdowns
      // We fetch all active movies to pull the available genres, years, and ratings.
      const allMovies = await content.find(
        { contentType: 'movie', isDeleted: false },
        'genre release rating'
      );

      const uniqueGenres = new Set();
      const uniqueYears = new Set();
      const uniqueRatings = new Set();

      allMovies.forEach((movie) => {
        // Extract unique genres
        if (movie.genre) {
          const genresArray = Array.isArray(movie.genre)
            ? movie.genre
            : movie.genre.split(',');
          genresArray.forEach((g) => {
            if (g.trim()) uniqueGenres.add(g.trim());
          });
        }

        // Extract unique years (assuming release holds year at the end, e.g., "12 Oct 2023" or "2023")
        if (movie.release) {
          const yr = movie.release.toString().slice(-4);
          if (!isNaN(yr) && yr.trim() !== '') uniqueYears.add(yr);
        }

        // Extract unique ratings (Grouped by whole numbers e.g., 6+, 7+, 8+)
        if (movie.rating && !isNaN(movie.rating)) {
          uniqueRatings.add(Math.floor(movie.rating));
        }
      });

      res.status(200).json({
        message: 'Movies fetched successfully',
        success: true,
        data: {
          movies,
          options: {
            genres: Array.from(uniqueGenres).sort(),
            years: Array.from(uniqueYears).sort((a, b) => b - a), // Descending order
            ratings: Array.from(uniqueRatings).sort((a, b) => b - a), // Descending order
          },
        },
      });
    } catch (err) {
      next(err);
    }
  };

  series = async (req, res, next) => {
    try {
      const { searchQuery, genre, year, rating, sortBy } = req.body;

      // 1. Base query for active series
      let query = {
        contentType: 'series',
        isDeleted: false,
      };

      // 2. Search Query (Auto-triggered from frontend)
      if (searchQuery) {
        query.$or = [
          { title: { $regex: searchQuery, $options: 'i' } },
          { genre: { $regex: searchQuery, $options: 'i' } },
        ];
      }

      // 3. Genre Filter
      if (genre && genre !== 'all') {
        query.genre = { $regex: genre, $options: 'i' };
      }

      // 4. Year Filter
      if (year && year !== 'all') {
        query.release = { $regex: year, $options: 'i' };
      }

      // 5. Rating Filter
      if (rating && rating !== 'all') {
        query.rating = { $gte: Number(rating) };
      }

      // 6. Database Sorting Logic
      let sortOption = { createdAt: -1 }; // Default: Newest added
      if (sortBy === 'rating') sortOption = { rating: -1 };
      if (sortBy === 'title') sortOption = { title: 1 };
      if (sortBy === 'seasons') sortOption = { seasons: -1 }; // Assuming you have a seasons count/array

      // Fetch the filtered/sorted series
      let seriesList = await content.find(query).sort(sortOption);

      // 6.5 JavaScript Sorting for 'year' (Extracting the last 4 characters safely)
      if (sortBy === 'year') {
        seriesList.sort((a, b) => {
          const yearA = parseInt(a.release?.toString().slice(-4)) || 0;
          const yearB = parseInt(b.release?.toString().slice(-4)) || 0;
          return yearB - yearA; // Descending order (Newest first)
        });
      }

      // 7. Extract Unique Dynamic Options for Dropdowns
      const allSeries = await content.find(
        { contentType: 'series', isDeleted: false },
        'genre release rating'
      );

      const uniqueGenres = new Set();
      const uniqueYears = new Set();
      const uniqueRatings = new Set();

      allSeries.forEach((item) => {
        if (item.genre) {
          const genresArray = Array.isArray(item.genre)
            ? item.genre
            : item.genre.split(',');
          genresArray.forEach((g) => {
            if (g.trim()) uniqueGenres.add(g.trim());
          });
        }

        if (item.release) {
          const yr = item.release.toString().slice(-4);
          if (!isNaN(yr) && yr.trim() !== '') uniqueYears.add(yr);
        }

        if (item.rating && !isNaN(item.rating)) {
          uniqueRatings.add(Math.floor(item.rating));
        }
      });

      res.status(200).json({
        message: 'Series fetched successfully',
        success: true,
        data: {
          series: seriesList,
          options: {
            genres: Array.from(uniqueGenres).sort(),
            years: Array.from(uniqueYears).sort((a, b) => b - a),
            ratings: Array.from(uniqueRatings).sort((a, b) => b - a),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
