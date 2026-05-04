import user from '../../models/userModel.js';
import activity from '../../models/activityModel.js';
import content from '../../models/contentModel.js';
import escapeRegex from '../../utils/searchRegex.js';
import FetchContent from '../../utils/FetchContent.js';

const imdb = new FetchContent();

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

  deleteContent = async (req, res, next) => {
    try {
      // Step 1: Soft delete content
      const updatedContent = await content.findOneAndUpdate(
        { _id: req.body.contentId, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true }
      );

      if (!updatedContent) {
        res.status(400);
        throw new Error('Content not available or deleted.');
      }

      // Step 2: Run IMDb fetch + activity creation in parallel
      const [contentData] = await Promise.all([
        imdb.fetchContent(updatedContent.imdbId),
      ]);

      // Step 3: Activity log (depends on IMDb data)
      await activity.create({
        adminId: req.user._id,
        adminName: req.user.name,
        adminEmail: req.user.email,
        action: `${contentData?.Type === 'movie' ? 'Movie' : 'Series'} Deleted`,
        targetName:
          contentData?.Title && contentData?.Released
            ? `${contentData.Title} (${contentData.Released.slice(-4)})`
            : 'Unknown Content',
        targetDetails: `https://www.imdb.com/title/${updatedContent.imdbId}/`,
      });

      // Step 4: Response
      res.status(200).json({
        message: `${
          contentData?.Type === 'movie' ? 'Movie' : 'Series'
        } deleted successfully`,
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  // Helper to escape regex (if not already globally defined in your project)
  fetchActivity = async (req, res, next) => {
    try {
      const {
        search = '',
        action = 'all',
        time = 'all',
        page = 1,
        limit = 5, // Defaulting to 10 for logs is usually better
      } = req.body;

      const query = {};

      // 1. Apply Search Filter (matches Admin Name, Email, or Target Name)
      if (search) {
        const safeSearch = escapeRegex(search);
        query.$or = [
          { adminName: { $regex: safeSearch, $options: 'i' } },
          { adminEmail: { $regex: safeSearch, $options: 'i' } },
          { targetName: { $regex: safeSearch, $options: 'i' } },
          // Note: Since adminId is now a String, if you ever want to allow searching
          // by exact Admin ID, you could simply add: { adminId: safeSearch }
        ];
      }

      // 2. Apply Action Filter
      if (action && action !== 'all') {
        query.action = action;
      }

      // 3. Apply Time Filter
      if (time && time !== 'all') {
        const targetDate = new Date();
        if (time === '7days') {
          targetDate.setDate(targetDate.getDate() - 7);
        } else if (time === '30days') {
          targetDate.setDate(targetDate.getDate() - 30);
        } else if (time === '1year') {
          targetDate.setFullYear(targetDate.getFullYear() - 1);
        }
        query.createdAt = { $gte: targetDate };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // 4. Run queries in parallel for optimal performance
      const [activities, totalCount, allActions] = await Promise.all([
        activity
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        activity.countDocuments(query),
        activity.distinct('action'), // Get all unique action types for the dropdown
      ]);

      res.status(200).json({
        message: 'Activity logs fetched successfully.',
        success: true,
        data: {
          activities,
          allActions, // Send dynamic actions to populate dropdown
          totalPages: Math.ceil(totalCount / parseInt(limit)) || 1,
          currentPage: parseInt(page),
          totalLogs: totalCount,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  exportLogs = async (req, res, next) => {
    try {
      const { search = '', action = 'all', time = 'all' } = req.body;

      const query = {};

      // 1. Apply Search Filter
      if (search) {
        const safeSearch = escapeRegex(search);
        query.$or = [
          { adminName: { $regex: safeSearch, $options: 'i' } },
          { adminEmail: { $regex: safeSearch, $options: 'i' } },
          { targetName: { $regex: safeSearch, $options: 'i' } },
        ];
      }

      // 2. Apply Action Filter
      if (action && action !== 'all') {
        query.action = action;
      }

      // 3. Apply Time Filter
      if (time && time !== 'all') {
        const targetDate = new Date();
        if (time === '7days') {
          targetDate.setDate(targetDate.getDate() - 7);
        } else if (time === '30days') {
          targetDate.setDate(targetDate.getDate() - 30);
        } else if (time === '1year') {
          targetDate.setFullYear(targetDate.getFullYear() - 1);
        }
        query.createdAt = { $gte: targetDate };
      }

      // Fetch all matching logs without pagination
      const activities = await activity
        .find(query)
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json({
        message: 'Logs exported successfully.',
        success: true,
        data: activities,
      });
    } catch (err) {
      next(err);
    }
  };
}
