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
          isDeleted: false,
          validTill: { $gt: new Date() },
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
      await mailer.activationMailer(
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

  // fetchUsers Controller
  fetchUsers = async (req, res, next) => {
    try {
      const {
        search = '',
        status = 'all',
        sort = 'newest', // Replaced role with sort
        page = 1,
        limit = 5,
      } = req.body;

      // Base query: Strictly exclude admins
      const query = { role: { $ne: 'admin' }, isDeleted: false };

      // 1. Apply Search Filter (Case-insensitive)
      if (search) {
        const safeSearch = this.escapeRegex(search);
        query.$or = [
          { name: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
        ];
      }

      // 2. Apply Status Filter (Simplified since admins are gone)
      if (status && status !== 'all') {
        if (status === 'active') {
          query.isBlocked = false;
          query.validTill = { $gte: new Date() };
        } else if (status === 'blocked') {
          query.isBlocked = true;
        } else if (status === 'expired') {
          query.validTill = { $lt: new Date() };
        }
      }

      // 3. Apply Sorting Logic
      let sortQuery = { createdAt: -1 }; // Default: Newest first
      switch (sort) {
        case 'name_asc':
          sortQuery = { name: 1 };
          break;
        case 'name_desc':
          sortQuery = { name: -1 };
          break;
        case 'login_recent':
          sortQuery = { lastLogin: -1 };
          break;
        case 'expiry_soon':
          sortQuery = { validTill: 1 };
          break;
        case 'expiry_latest':
          sortQuery = { validTill: -1 };
          break;
        case 'newest':
        default:
          sortQuery = { createdAt: -1 };
          break;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // 4. Run queries in parallel
      const [users, totalCount] = await Promise.all([
        user
          .find(query)
          .sort(sortQuery)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        user.countDocuments(query),
      ]);

      res.status(200).json({
        message: 'User details fetched successfully.',
        success: true,
        data: {
          users,
          totalPages: Math.ceil(totalCount / parseInt(limit)) || 1,
          currentPage: parseInt(page),
          totalUsers: totalCount,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  changeStatus = async (req, res, next) => {
    try {
      if (!req.body.userId) {
        res.status(400);
        throw new Error('UserId is Required');
      }

      const updatedUser = await user.findOneAndUpdate(
        { _id: req.body.userId, isDeleted: false },
        [
          {
            $set: {
              isBlocked: { $not: '$isBlocked' },
            },
          },
        ],
        {
          returnDocument: 'after',
          updatePipeline: true, // required for your mongoose version
        }
      );

      if (!updatedUser) {
        res.status(400);
        throw new Error('User does not exists or deleted.');
      }

      const message = `User ${
        updatedUser.isBlocked ? 'blocked' : 'unblocked'
      } successfully.`;

      res.status(200).json({
        message,
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  renewUser = async (req, res, next) => {
    try {
      if (!req.body.userId) {
        res.status(400);
        throw new Error('UserId is Required');
      }

      const inputDate = new Date(req.body.date);
      const tomorrow = new Date();

      inputDate.setHours(0, 0, 0, 0);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      if (inputDate < tomorrow) {
        throw new Error('Date must be at least tomorrow');
      }

      const now = new Date();
      inputDate.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds()
      );

      const updatedUser = await user.findOneAndUpdate(
        { _id: req.body.userId, isDeleted: false },
        { $set: { validTill: inputDate } },
        { new: true } // Returns the modified document
      );

      res.status(200).json({
        message: 'User subscription renewed',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  deleteUser = async (req, res, next) => {
    try {
      if (!req.body.userId) {
        res.status(400);
        throw new Error('UserId is Required');
      }

      const updatedUser = await user.findOneAndUpdate(
        { _id: req.body.userId, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true } // Returns the modified document
      );

      if (!updatedUser) {
        res.status(400);
        throw new Error('User does not exists or deleted.');
      }

      res.status(200).json({
        message: 'User deleted successfully',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  

  escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };



  deleteContent = async (req, res, next) => {
    try {
      if (!req.body.contentId) {
        res.status(400);
        throw new Error('ContentId is Required');
      }

      const updatedContent = await content.findOneAndUpdate(
        { _id: req.body.contentId, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true } // Returns the modified document
      );

      if (!updatedContent) {
        res.status(400);
        throw new Error('Content not available or deleted.');
      }

      res.status(200).json({
        message: 'Content deleted successfully',
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
