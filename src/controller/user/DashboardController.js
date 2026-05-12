import DateFormatter from '../../utils/DateFormatter.js';
import content from '../../models/contentModel.js';

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
}
