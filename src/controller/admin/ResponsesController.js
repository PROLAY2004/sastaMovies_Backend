import mongoose from 'mongoose';

import contact from '../../models/contactModel.js';
import user from '../../models/userModel.js';
import escapeRegex from '../../utils/searchRegex.js';

export default class ResponsesController {
  fetchResponses = async (req, res, next) => {
    try {
      const {
        search = '',
        status = 'all',
        userType = 'all',
        page = 1,
        limit = 5,
      } = req.body;

      const query = { isDeleted: false };

      // 1. Apply Search Filter (Case-insensitive for Name or Email)
      if (search) {
        const safeSearch = escapeRegex(search);
        query.$or = [
          { name: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
        ];
      }

      // 2. Apply Status Filter
      if (status === 'new') {
        query.isRead = { $ne: true }; // Catches false, null, "false", and missing fields
      } else if (status === 'viewed') {
        query.isRead = true;
      }

      // 3. Apply User Type Filter (Existing vs Unknown)
      if (userType !== 'all') {
        // Fetch all existing user emails to compare against contacts
        const existingUsers = await user
          .find({ isDeleted: false })
          .select('email')
          .lean();
        const existingEmails = existingUsers.map((u) => u.email);

        if (userType === 'existing') {
          query.email = { $in: existingEmails };
        } else if (userType === 'unknown') {
          query.email = { $nin: existingEmails };
        }
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // 4. Fetch data in parallel
      const [responses, totalCount] = await Promise.all([
        contact
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        contact.countDocuments(query),
      ]);

      res.status(200).json({
        message: 'Responses fetched successfully.',
        success: true,
        data: {
          adminDetails: req.user,
          responses,
          totalPages: Math.ceil(totalCount / parseInt(limit)) || 1,
          currentPage: parseInt(page),
          totalResponses: totalCount,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  markAsRead = async (req, res, next) => {
    try {
      const { messageId } = req.body;

      const updatedMessage = await contact.findOneAndUpdate(
        { _id: messageId },
        {
          isRead: true,
          readBy: req.user.name || req.user._id,
        },
        { new: true }
      );

      if (!updatedMessage) {
        res.status(404);
        throw new Error('Message not found.');
      }

      res.status(200).json({
        message: 'Message marked as read.',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  // Add this inside the ResponsesController class
  getMessageById = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid message ID format. Please check the URL.');
      }

      const message = await contact.findById(id);

      if (!message || message.isDeleted) {
        res.status(404);
        throw new Error('Message not found.');
      }

      // If opening it for the first time via deep link, mark as read
      let updatedMessage = message;
      if (!message.isRead) {
        updatedMessage = await contact.findOneAndUpdate(
          { _id: id },
          {
            isRead: true,
            readBy: req.user.name || req.user._id,
          },
          { new: true }
        );
      }

      res.status(200).json({
        message: 'Message fetched successfully.',
        success: true,
        data: updatedMessage,
      });
    } catch (err) {
      next(err);
    }
  };
}
