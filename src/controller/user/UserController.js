import content from '../../models/contentModel.js';
import user from '../../models/userModel.js';

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
          .limit(12),

        content
          .find({
            contentType: 'series',
            isDeleted: false,
          })
          .limit(12),
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

      const contentInfo = await content.findOne({
        _id: req.body.contentId,
        isDeleted: false,
      });

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
}
