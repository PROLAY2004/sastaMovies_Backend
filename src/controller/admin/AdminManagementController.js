// controllers/AdminManagementController.js
import user from '../../models/userModel.js';
import activity from '../../models/activityModel.js';
import escapeRegex from '../../utils/searchRegex.js';
import SendEmailService from '../../services/sendMailService.js';

const mailer = new SendEmailService();

export default class AdminManagementController {
  // 1. Fetch Admins
  fetchAdmins = async (req, res, next) => {
    try {
      const {
        search = '',
        status = 'all',
        sort = 'newest',
        page = 1,
        limit = 5,
      } = req.body;

      // Strictly fetch only admins who are NOT super admins
      const query = { role: 'admin', isSuperAdmin: false, isDeleted: false };

      if (search) {
        const safeSearch = escapeRegex(search);
        query.$or = [
          { name: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
        ];
      }

      if (status && status !== 'all') {
        if (status === 'active') query.isBlocked = false;
        else if (status === 'blocked') query.isBlocked = true;
      }

      let sortQuery = { createdAt: -1 };
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
        case 'newest':
        default:
          sortQuery = { createdAt: -1 };
          break;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [admins, totalCount] = await Promise.all([
        user
          .find(query)
          .sort(sortQuery)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        user.countDocuments(query),
      ]);

      res.status(200).json({
        message: 'Admin details fetched successfully.',
        success: true,
        data: {
          admins,
          adminDetails: req.user,
          totalPages: Math.ceil(totalCount / parseInt(limit)) || 1,
          currentPage: parseInt(page),
          totalAdmins: totalCount,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  // 2. Add Admin
  addAdmin = async (req, res, next) => {
    try {
      const { name, email, permissions } = req.body;
      const isUser = await user.findOne({ email, isDeleted: false });

      if (isUser && isUser.role === 'admin') {
        res.status(400);
        throw new Error('Email already exists as admin.');
      } else if (isUser && isUser.role === 'user') {
        res.status(400);
        throw new Error('Email already exists as user.');
      }

      if (!permissions.length) {
        res.status(400);
        throw new Error('Admin should have atleast one permission');
      }

      const newAdmin = await user.create({
        name,
        email,
        role: 'admin',
        permission: permissions,
      });

      await activity.create({
        adminId: req.user._id,
        adminName: req.user.name,
        adminEmail: req.user.email,
        action: 'New Admin Added',
        targetName: newAdmin.name,
        targetDetails: newAdmin.email,
      });

      mailer.newAdminMailer(newAdmin.name, newAdmin.email);

      res
        .status(200)
        .json({ message: 'Admin added successfully.', success: true });
    } catch (err) {
      next(err);
    }
  };

  // 3. Change Status (Block/Unblock)
  changeStatus = async (req, res, next) => {
    try {
      if (!req.body.adminId) throw new Error('AdminId is Required');

      const updatedAdmin = await user.findOneAndUpdate(
        { _id: req.body.adminId, role: 'admin', isDeleted: false },
        [{ $set: { isBlocked: { $not: '$isBlocked' } } }],
        { returnDocument: 'after', updatePipeline: true }
      );

      if (!updatedAdmin)
        throw new Error('Admin does not exist or was deleted.');

      await activity.create({
        adminId: req.user._id,
        adminName: req.user.name,
        adminEmail: req.user.email,
        action: `Admin ${updatedAdmin.isBlocked ? 'blocked' : 'unblocked'}`,
        targetName: updatedAdmin.name,
        targetDetails: updatedAdmin.email,
      });

      res.status(200).json({
        message: `Admin ${updatedAdmin.isBlocked ? 'blocked' : 'unblocked'} successfully.`,
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  // 4. Update Permissions
  updatePermissions = async (req, res, next) => {
    try {
      const { adminId, permissions } = req.body;
      if (!adminId) throw new Error('AdminId is Required');

      if (!permissions.length) {
        res.status(400);
        throw new Error('Admin should have atleast one permission');
      }

      const updatedAdmin = await user.findOneAndUpdate(
        { _id: adminId, role: 'admin', isDeleted: false },
        { $set: { permission: permissions } },
        { new: true }
      );

      if (!updatedAdmin)
        throw new Error('Admin does not exist or was deleted.');

      await activity.create({
        adminId: req.user._id,
        adminName: req.user.name,
        adminEmail: req.user.email,
        action: `Admin Permissions Updated`,
        targetName: updatedAdmin.name,
        targetDetails: updatedAdmin.email,
      });

      res
        .status(200)
        .json({ message: 'Permissions updated successfully', success: true });
    } catch (err) {
      next(err);
    }
  };

  // 5. Downgrade Admin to User
  downgradeAdmin = async (req, res, next) => {
    try {
      const { adminId, date } = req.body;

      if (!adminId) {
        res.status(400);
        throw new Error('AdminId is Required');
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

      // ✅ CREATE CLEAN DATE
      const now = new Date();
      const validTill = new Date(date);

      validTill.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds()
      );

      const updatedAdmin = await user.findOneAndUpdate(
        { _id: adminId, isDeleted: false },
        {
          $set: {
            role: 'user',
            permission: [],
            validTill,
          },
        },
        { new: true }
      );

      if (!updatedAdmin) {
        res.status(400);
        throw new Error('Admin does not exist or was deleted.');
      }

      await activity.create({
        adminId: req.user._id,
        adminName: req.user.name,
        adminEmail: req.user.email,
        action: `Admin Downgraded to User`,
        targetName: updatedAdmin.name,
        targetDetails: updatedAdmin.email,
      });

      res.status(200).json({
        message: 'Admin downgraded to User successfully',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  // 6. Delete Admin
  deleteAdmin = async (req, res, next) => {
    try {
      if (!req.body.adminId) throw new Error('AdminId is Required');

      const updatedAdmin = await user.findOneAndUpdate(
        { _id: req.body.adminId, role: 'admin', isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true }
      );

      if (!updatedAdmin)
        throw new Error('Admin does not exist or was deleted.');

      await activity.create({
        adminId: req.user._id,
        adminName: req.user.name,
        adminEmail: req.user.email,
        action: `Admin Deleted`,
        targetName: updatedAdmin.name,
        targetDetails: updatedAdmin.email,
      });

      res
        .status(200)
        .json({ message: 'Admin deleted successfully', success: true });
    } catch (err) {
      next(err);
    }
  };
}
