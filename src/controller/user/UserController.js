import DateFormatter from '../../utils/DateFormatter.js';

const format = new DateFormatter();

export default class UserController {
  dashboard = async (req, res, next) => {
    try {
      const userInfo = req.user;
      const userSince = format.dateTemplate(userInfo.createdAt);
      const validTill = format.dateTemplate(userInfo.validTill);
      const contentCount = userInfo.savedContents.length;

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
