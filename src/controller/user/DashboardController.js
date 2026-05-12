import DateFormatter from '../../utils/DateFormatter.js';
import content from '../../models/contentModel.js';
import user from '../../models/userModel.js';

const format = new DateFormatter();

export default class DashboardController {
  fetchProfile = async (req, res, next) => {
    try {
      const userInfo = req.user.toObject();
      const userSince = format.dateTemplate(userInfo.createdAt);
      const validTill = format.dateTemplate(userInfo.validTill);
      const contentCount = userInfo.savedContents.length;

      userInfo.contentObjects = await content.find({
        _id: { $in: userInfo.savedContents },
        isDeleted: false,
      });

      res.status(200).json({
        message: 'User Deails fetched successfully',
        success: true,
        data: {
          userInfo,
          userSince,
          validTill,
          contentCount,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  removeAll = async (req, res, next) => {
    try {
      await user.findOneAndUpdate(
        { _id: req.user._id },
        { $set: { savedContents: [] } },
        { new: true }
      );

      res.status(200).json({
        message: 'Removed all successfully',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };
}
