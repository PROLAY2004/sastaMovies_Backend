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
}
