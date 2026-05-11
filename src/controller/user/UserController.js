import content from '../../models/contentModel.js';
import user from '../../models/userModel.js';

export default class UserController {
  getUser = async (req, res, next) => {
    try {
      res.status(200).json({
        message: 'userDetails fetched successfully',
        success: true,
        data: {
          user : req.user,
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

        content.find({
          contentType: 'movie',
          isDeleted: false,
        }),

        content.find({
          contentType: 'series',
          isDeleted: false,
        }),
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

      if (req.user.savedContents.includes(req.params.contentId)) {
        const updatedUser = await user.findOneAndUpdate(
          { _id: req.user._id, isDeleted: false },
          {
            $pull: {
              savedContents: req.params.contentId,
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
              savedContents: req.params.contentId,
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
}
