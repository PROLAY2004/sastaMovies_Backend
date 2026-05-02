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
      const { name, email, date } = req.body;

      // 🔹 Check existing user
      const isUser = await user.findOne({ email });
      if (isUser) {
        res.status(400);
        throw new Error('Email already exists.');
      }

      // 🔹 Create validTill (date + current time)
      const now = new Date();
      const validTill = new Date(date);

      validTill.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds()
      );

      // 🔹 Save user
      const newUser = new user({ name, email, validTill });
      await newUser.save();

      // 🔹 Send mail
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

  fetchUsers = async (req, res, next) => {
    try {
      

      res.status(200).json({
        message: 'User details fetched successfully.',
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
      const { imdbLink, posterLink, seasons } = req.body;

      const response = await imdbFetch.fetchSeries(imdbLink);

      const isExists = await content.findOne({
        imdbId: response.imdbId,
        isDeleted: false,
      });

      if (isExists) {
        res.status(400);
        throw new Error('Series already exists.');
      }

      // 🔥 1. Flatten all episodes with season index
      const flat = [];

      seasons.forEach((season, sIndex) => {
        season.episodes.forEach((ep) => {
          const { totalChunks, totalSize, ...rest } = ep;

          flat.push({
            ...rest,
            chunkCount: Number(totalChunks),
            size_byte: Number(totalSize),
            imdbId: response.imdbId || '',
            _seasonIndex: sIndex, // track season
          });
        });
      });

      // 🚀 2. Single bulk insert (FASTEST)
      const inserted = await bucket.insertMany(flat);

      // 🔁 3. Rebuild contentIds (season-wise)
      const contentIds = Array.from({ length: seasons.length }, () => []);

      inserted.forEach((doc, i) => {
        const sIndex = flat[i]._seasonIndex;
        contentIds[sIndex].push(doc._id);
      });

      // 📦 4. Create content
      await content.create({
        imdbId: response.imdbId || '',
        title: response.seriesData.data.Title || '',
        description: response.seriesData.data.Plot || '',
        release: response.seriesData.data.Released || '',
        cast: response.seriesData.data.Actors.split(', ') || '',
        runtime: response.seriesData.data.Runtime || '0 min',
        rating: parseFloat(response.seriesData.data.imdbRating) || 0,
        genre: response.seriesData.data.Genre.split(', ') || '',
        posterUrl: {
          horizontal: posterLink,
          vertical: response.seriesData.data.Poster || '',
        },
        contentType: 'series',
        contentIds,
      });

      res.status(200).json({
        message: 'Series added successfully.',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  fetchSeries = async (req, res, next) => {
    try {
      const {
        search = '',
        genre = 'all',
        year = 'all',
        page = 1,
        limit = 5,
      } = req.body;

      const query = { contentType: 'series', isDeleted: false };

      if (search) {
        const safeSearch = this.escapeRegex(search);
        query.title = { $regex: safeSearch, $options: 'i' };
      }

      if (genre && genre !== 'all') {
        query.genre = genre;
      }

      if (year && year !== 'all') {
        query.release = { $regex: year.toString(), $options: 'i' };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [seriesData, totalCount, rawGenres, releaseDates] =
        await Promise.all([
          content
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
          content.countDocuments(query),
          content.distinct('genre', {
            contentType: 'series',
            isDeleted: false,
          }),
          content
            .find({ contentType: 'series', isDeleted: false })
            .select('release')
            .lean(),
        ]);

      // FIX: Extract ALL bucket IDs from the nested arrays
      const allBucketIds = seriesData
        .flatMap((seriesItem) => seriesItem.contentIds.flat())
        .filter((id) => id);

      // Fetch all corresponding buckets in one go
      const buckets = await bucket.find({ _id: { $in: allBucketIds } }).lean();

      // Create a dictionary map for fast lookup
      const bucketMap = buckets.reduce((acc, bucketItem) => {
        acc[bucketItem._id.toString()] = bucketItem;
        return acc;
      }, {});

      // FIX: Reconstruct the full Season/Episode structure for the frontend
      const formattedSeries = seriesData.map((seriesItem) => {
        const mappedSeasons = (seriesItem.contentIds || []).map(
          (seasonIds, sIndex) => {
            return {
              seasonNumber: sIndex + 1,
              episodes: seasonIds.map((epId) => {
                const bData = bucketMap[epId.toString()] || {};
                return {
                  _id: bData._id,
                  baseUrl: bData.baseUrl || '',
                  totalChunks: bData.chunkCount || '', // Map DB field to frontend state
                  totalSize: bData.size_byte || '', // Map DB field to frontend state
                  mimeType: bData.mimeType || '',
                  subtitleLink: bData.subtitleUrl || '', // Map DB field to frontend state
                };
              }),
            };
          }
        );

        return {
          ...seriesItem,
          seasons: mappedSeasons, // Attach the full reconstructed seasons array
        };
      });

      const allYears = [
        ...new Set(
          releaseDates
            .filter((s) => s.release)
            .map((s) => new Date(s.release).getFullYear())
        ),
      ].sort((a, b) => b - a);

      const allGenres = [...new Set(rawGenres.flat())];

      res.status(200).json({
        message: 'Series details fetched successfully.',
        success: true,
        data: {
          series: formattedSeries, // Send the newly structured series
          allGenres,
          allYears,
          totalPages: Math.ceil(totalCount / parseInt(limit)) || 1,
          currentPage: parseInt(page),
          totalSeries: totalCount,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  editSeries = async (req, res, next) => {
    try {
      const { contentId, imdbLink, posterLink, seasons } = req.body;

      if (!contentId) {
        res.status(400);
        throw new Error('ContentId is required.');
      }

      // 1. Fail Fast: Check DB before slow external API call
      const extractedIdMatch = imdbLink.match(/(tt\d+)/);
      const extractedImdbId = extractedIdMatch ? extractedIdMatch[1] : null;

      if (extractedImdbId) {
        const isExists = await content
          .findOne({
            imdbId: extractedImdbId,
            _id: { $ne: contentId },
            isDeleted: false,
          })
          .lean();

        if (isExists) {
          res.status(400);
          throw new Error('Another series with this IMDB ID already exists.');
        }
      }

      const response = await imdbFetch.fetchSeries(imdbLink);

      const oldContent = await content.findById(contentId).lean();
      if (!oldContent) {
        res.status(404);
        throw new Error('Series not found.');
      }

      // Initialize structures
      const newContentIds = Array.from({ length: seasons.length }, () => []);
      const newEpisodesFlat = [];
      const bulkOps = [];
      const keptBucketIds = [];

      // 2. Separate new episodes (for insertMany) from existing ones (for bulkWrite)
      seasons.forEach((season, sIndex) => {
        season.episodes.forEach((ep, eIndex) => {
          const bucketData = {
            imdbId: response.imdbId || '',
            baseUrl: ep.baseUrl,
            chunkCount: Number(ep.totalChunks || ep.chunkCount),
            size_byte: Number(ep.totalSize || ep.size_byte),
            subtitleUrl: ep.subtitleLink || ep.subtitleUrl || '',
            mimeType: ep.mimeType.toLowerCase(),
          };

          if (ep._id) {
            // Existing episode -> Queue for bulk update
            bulkOps.push({
              updateOne: {
                filter: { _id: ep._id },
                update: { $set: bucketData },
              },
            });
            // Place exactly at its index to preserve array order
            newContentIds[sIndex][eIndex] = ep._id;
            keptBucketIds.push(ep._id.toString());
          } else {
            // New episode -> Queue for insertMany (same logic as addSeries)
            newEpisodesFlat.push({
              ...bucketData,
              _seasonIndex: sIndex,
              _episodeIndex: eIndex, // track exact episode position
            });
          }
        });
      });

      // 3. Handle NEW episodes via insertMany
      if (newEpisodesFlat.length > 0) {
        const inserted = await bucket.insertMany(newEpisodesFlat);

        // Rebuild contentIds exactly where they belong
        inserted.forEach((doc, i) => {
          const sIndex = newEpisodesFlat[i]._seasonIndex;
          const eIndex = newEpisodesFlat[i]._episodeIndex;
          newContentIds[sIndex][eIndex] = doc._id;
          keptBucketIds.push(doc._id.toString());
        });
      }

      // 4. Handle DELETED episodes
      const oldBucketIdsFlat = oldContent.contentIds
        .flat()
        .map((id) => id.toString());
      const bucketsToDelete = oldBucketIdsFlat.filter(
        (id) => !keptBucketIds.includes(id)
      );

      if (bucketsToDelete.length > 0) {
        bulkOps.push({
          deleteMany: {
            filter: { _id: { $in: bucketsToDelete } },
          },
        });
      }

      // 5. Execute Updates/Deletes and update main content simultaneously
      await Promise.all([
        bulkOps.length > 0 ? bucket.bulkWrite(bulkOps) : Promise.resolve(),

        content.findByIdAndUpdate(
          contentId,
          {
            imdbId: response.imdbId || '',
            title: response.seriesData.data.Title || '',
            description: response.seriesData.data.Plot || '',
            release: response.seriesData.data.Released || '',
            cast: response.seriesData.data.Actors.split(', ') || '',
            runtime: response.seriesData.data.Runtime || '0 min',
            rating: parseFloat(response.seriesData.data.imdbRating) || 0,
            genre: response.seriesData.data.Genre.split(', ') || '',
            posterUrl: {
              horizontal: posterLink,
              vertical: response.seriesData.data.Poster || '',
            },
            contentIds: newContentIds,
          },
          { new: true }
        ),
      ]);

      res.status(200).json({
        message: 'Series updated successfully.',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };
}
