import content from '../../models/contentModel.js';

export default class AccessValidation {
  movieAccess = async (req, res, next) => {
    try {
      const userPermission = req.user.permission;

      if (!req.user.isSuperAdmin && !userPermission.includes('movies')) {
        res.status(400);

        throw new Error('Admin permission denied.');
      }

      next();
    } catch (err) {
      next(err);
    }
  };

  seriesAccess = async (req, res, next) => {
    try {
      const userPermission = req.user.permission;

      if (!req.user.isSuperAdmin && !userPermission.includes('series')) {
        res.status(400);

        throw new Error('Admin permission denied.');
      }

      next();
    } catch (err) {
      next(err);
    }
  };

  userAccess = async (req, res, next) => {
    try {
      const userPermission = req.user.permission;

      if (!req.user.isSuperAdmin && !userPermission.includes('users')) {
        res.status(400);

        throw new Error('Admin permission denied.');
      }

      next();
    } catch (err) {
      next(err);
    }
  };

  deleteContentAccess = async (req, res, next) => {
    try {
      const userPermission = req.user.permission;
      const contentId = req.body.contentId;

      if (!contentId) {
        res.status(400);
        throw new Error('ContentId is Required');
      }

      const contentDetails = await content.findOne({ _id: contentId });

      if (
        !req.user.isSuperAdmin &&
        contentDetails.contentType === 'movie' &&
        !userPermission.includes('movies')
      ) {
        res.status(400);

        throw new Error('Admin permission denied.');
      } else if (
        !req.user.isSuperAdmin &&
        contentDetails.contentType === 'series' &&
        !userPermission.includes('series')
      ) {
        res.status(400);

        throw new Error('Admin permission denied.');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
