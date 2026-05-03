import user from '../../models/userModel.js';
import Activity from '../../models/activityModel.js';
import content from '../../models/contentModel.js';
import escapeRegex from '../../utils/searchRegex.js';

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



// Helper to escape regex (if not already globally defined in your project)
fetchActivity = async (req, res, next) => {
  try {
    const {
      search = '',
      action = 'all',
      time = 'all',
      page = 1,
      limit = 10, // Defaulting to 10 for logs is usually better
    } = req.body;

    const query = {};

    // 1. Apply Search Filter (matches Admin Name, Email, or Target Name)
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

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 4. Run queries in parallel
    const [activities, totalCount, allActions] = await Promise.all([
      Activity.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Activity.countDocuments(query),
      Activity.distinct('action'), // Get all unique action types for the dropdown
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
}
