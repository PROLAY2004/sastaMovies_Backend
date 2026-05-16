import user from '../../models/userModel.js';
import activity from '../../models/activityModel.js';
import DateFormatter from '../../utils/DateFormatter.js';
import SendEmailService from '../../services/sendMailService.js';
import escapeRegex from '../../utils/searchRegex.js';

const mailer = new SendEmailService();
const format = new DateFormatter();

export default class UserController {
  invite = async (req, res, next) => {
    try {
      const { name, email, date } = req.body;
      const isUser = await user.findOne({ email, isDeleted: false });

      if (isUser && isUser.role === 'admin') {
        res.status(400);
        throw new Error('Email already exists as admin.');
      } else if (isUser && isUser.role === 'user') {
        res.status(400);
        throw new Error('Email already exists as user.');
      }

      const now = new Date();
      const validTill = new Date(date);

      validTill.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds()
      );

      const newUser = await user.create({ name, email, validTill });

      await activity.create({
        adminId: req.user._id,
        adminName: req.user.name,
        adminEmail: req.user.email,
        action: 'New User Added',
        targetName: name,
        targetDetails: email,
      });

      // 🔹 Send mail
      mailer.activationMailer(
        name,
        email,
        format.dateAndTimeTemplate(Date.now()),
        format.dateTemplate(validTill)
      );

      res.status(200).json({
        message: 'Invitation sent successfully.',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  // fetchUsers Controller
  fetchUsers = async (req, res, next) => {
    try {
      const {
        search = '',
        status = 'all',
        sort = 'newest', // Replaced role with sort
        page = 1,
        limit = 5,
      } = req.body;

      // Base query: Strictly exclude admins
      const query = { role: { $ne: 'admin' }, isDeleted: false };

      // 1. Apply Search Filter (Case-insensitive)
      if (search) {
        const safeSearch = escapeRegex(search);
        query.$or = [
          { name: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
        ];
      }

      // 2. Apply Status Filter (Simplified since admins are gone)
      if (status && status !== 'all') {
        if (status === 'active') {
          query.isBlocked = false;
          query.validTill = { $gt: new Date() };
        } else if (status === 'blocked') {
          query.isBlocked = true;
        } else if (status === 'expired') {
          query.validTill = { $lt: new Date() };
        }
      }

      // 3. Apply Sorting Logic
      let sortQuery = { createdAt: -1 }; // Default: Newest first
      switch (sort) {
        case 'name_asc':
          sortQuery = { name: 1 };
          break;
        case 'name_desc':
          sortQuery = { name: -1 };
          break;
        case 'login_recent':
          sortQuery = { lastLogin: -1 };
          break;
        case 'expiry_soon':
          sortQuery = { validTill: 1 };
          break;
        case 'expiry_latest':
          sortQuery = { validTill: -1 };
          break;
        case 'newest':
        default:
          sortQuery = { createdAt: -1 };
          break;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // 4. Run queries in parallel
      const [users, totalCount] = await Promise.all([
        user
          .find(query)
          .sort(sortQuery)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        user.countDocuments(query),
      ]);

      res.status(200).json({
        message: 'User details fetched successfully.',
        success: true,
        data: {
          users,
          adminDetails: req.user,
          totalPages: Math.ceil(totalCount / parseInt(limit)) || 1,
          currentPage: parseInt(page),
          totalUsers: totalCount,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  changeStatus = async (req, res, next) => {
    try {
      if (!req.body.userId) {
        res.status(400);
        throw new Error('UserId is Required');
      }

      const updatedUser = await user.findOneAndUpdate(
        { _id: req.body.userId, isDeleted: false },
        [
          {
            $set: {
              isBlocked: { $not: '$isBlocked' },
            },
          },
        ],
        {
          returnDocument: 'after',
          updatePipeline: true, // required for your mongoose version
        }
      );

      if (!updatedUser) {
        res.status(400);
        throw new Error('User does not exists or deleted.');
      }

      await activity.create({
        adminId: req.user._id,
        adminName: req.user.name,
        adminEmail: req.user.email,
        action: `User ${updatedUser.isBlocked ? 'blocked' : 'unblocked'}`,
        targetName: updatedUser.name,
        targetDetails: updatedUser.email,
      });

      const message = `User ${
        updatedUser.isBlocked ? 'blocked' : 'unblocked'
      } successfully.`;

      res.status(200).json({
        message,
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  renewUser = async (req, res, next) => {
    try {
      const { userId, date } = req.body;

      if (!userId) {
        res.status(400);
        throw new Error('UserId is Required');
      }

      if (!date) {
        res.status(400);
        throw new Error('Date is Required');
      }

      // ✅ VALIDATION
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < tomorrow) {
        throw new Error('Date must be at least tomorrow');
      }

      // ✅ ALWAYS CREATE FRESH DATE OBJECT
      const now = new Date();
      const validTill = new Date(date);

      validTill.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds()
      );

      const updatedUser = await user.findOneAndUpdate(
        { _id: userId, isDeleted: false },
        {
          $set: {
            validTill,
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        res.status(400);
        throw new Error('User does not exist or deleted.');
      }

      await activity.create({
        adminId: req.user._id,
        adminName: req.user.name,
        adminEmail: req.user.email,
        action: `Subscription Renewed`,
        targetName: updatedUser.name,
        targetDetails: updatedUser.email,
      });

      res.status(200).json({
        message: 'User subscription renewed',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  makeAdmin = async (req, res, next) => {
    try {
      if (!req.body.userId) {
        res.status(400);
        throw new Error('UserId is Required');
      }

      console.log(req.body.permissions);

      if (!req.body.permissions.length) {
        res.status(400);
        throw new Error('Admin should have atleast one permission');
      }

      const updatedUser = await user.findOneAndUpdate(
        { _id: req.body.userId, isDeleted: false },
        { $set: { role: 'admin', permission: req.body.permissions } },
        { new: true } // Returns the modified document
      );

      if (!updatedUser) {
        res.status(400);
        throw new Error('User does not exists or deleted.');
      }

      await activity.create({
        adminId: req.user._id,
        adminName: req.user.name,
        adminEmail: req.user.email,
        action: `User Upgraded`,
        targetName: updatedUser.name,
        targetDetails: updatedUser.email,
      });

      mailer.upgradeMailer(updatedUser.name, updatedUser.email);

      res.status(200).json({
        message: 'User upgraded successfully',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  deleteUser = async (req, res, next) => {
    try {
      if (!req.body.userId) {
        res.status(400);
        throw new Error('UserId is Required');
      }

      const updatedUser = await user.findOneAndUpdate(
        { _id: req.body.userId, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true } // Returns the modified document
      );

      if (!updatedUser) {
        res.status(400);
        throw new Error('User does not exists or deleted.');
      }

      await activity.create({
        adminId: req.user._id,
        adminName: req.user.name,
        adminEmail: req.user.email,
        action: `User Deleted`,
        targetName: updatedUser.name,
        targetDetails: updatedUser.email,
      });

      res.status(200).json({
        message: 'User deleted successfully',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };
}
