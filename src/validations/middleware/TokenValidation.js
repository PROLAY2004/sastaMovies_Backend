import configuration from '../../config/config.js';
import user from '../../models/userModel.js';
import verifyToken from '../../utils/tokenVerifier.js';

export default class TokenValidation {
  accessTokenValidator = async (req, res, next) => {
    try {
      const decoded = verifyToken(req, res, configuration.ACCESS_SECRET);
      const appUser = await user.findOne({ _id: decoded.userId });

      if (!appUser) {
        res.status(404);
        throw new Error('User does not exists.');
      }

      if (appUser.isBlocked) {
        res.status(401);
        throw new Error('User Blocked by admin.');
      }

      if (appUser.isDeleted) {
        res.status(401);

        throw new Error('User deleted. Logging out!');
      }

      const expiryTime = new Date(appUser.validTill);
      const now = new Date();

      if (now > expiryTime) {
        res.status(401);
        throw new Error('User subscription expired.');
      }

      req.user = appUser;
      next();
    } catch (err) {
      if (err.message == 'jwt expired') {
        res.status(401);
      }

      next(err);
    }
  };

  isAdmin = async (req, res, next) => {
    try {
      const decoded = verifyToken(req, res, configuration.ACCESS_SECRET);
      const appUser = await user.findOne({ _id: decoded.userId });

      if (appUser) {
        if (appUser.role !== 'admin') {
          res.status(403);

          throw new Error('Access Denied. Admins only.');
        }

        if (appUser.isBlocked || appUser.isDeleted) {
          res.status(401);

          throw new Error('User Restricted. Logged out!');
        }

        req.user = appUser;

        next();
      } else {
        res.status(404);
        throw new Error('User does not exist.');
      }
    } catch (err) {
      if (err.message == 'jwt expired') {
        res.status(401);
      }

      next(err);
    }
  };

  refreshTokenValidator = async (req, res, next) => {
    try {
      const decoded = verifyToken(req, res, configuration.REFRESH_SECRET);
      const appUser = await user.findOne({ _id: decoded.userId });

      if (appUser) {
        if (appUser.isBlocked || appUser.isDeleted) {
          res.status(401);

          throw new Error('User Restricted. Logged out!');
        }

        req.user = appUser;

        next();
      } else {
        res.status(401);
        throw new Error('User does not exist.');
      }
    } catch (err) {
      if (err.message == 'jwt expired') {
        res.status(401);
      }

      next(err);
    }
  };
}
