import axios from 'axios';

import content from '../../models/contentModel.js';
import user from '../../models/userModel.js';
import bucket from '../../models/bucketModel.js';
import getMimeType from '../../utils/mimeFormat.js';
import contact from '../../models/contactModel.js';
import SendEmailService from '../../services/sendMailService.js';

const mailer = new SendEmailService();
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
          .limit(12).sort({ createdAt: -1 }),

        content
          .find({
            contentType: 'series',
            isDeleted: false,
          })
          .limit(12).sort({ createdAt: -1 }),
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

      // FIX 1: Add .lean() to return a plain JavaScript object so we can modify it
      const contentInfo = await content
        .findOne({
          _id: req.body.contentId,
          isDeleted: false,
        })
        .lean();

      if (!contentInfo) {
        res.status(404);
        throw new Error('Content not found');
      }

      // FIX 2: Initialize the outer subtitles array
      contentInfo.subtitles = [];

      for (let i = 0; i < contentInfo.contentIds.length; i++) {
        // FIX 3: Initialize the inner array for each season
        contentInfo.subtitles[i] = [];

        for (let j = 0; j < contentInfo.contentIds[i].length; j++) {
          const bucketInfo = await bucket.findOne({
            _id: contentInfo.contentIds[i][j],
          });

          // Safely assign the subtitle URL (fallback to null if no bucket or subtitle exists)
          contentInfo.subtitles[i][j] = bucketInfo?.subtitleUrl || null;
        }
      }

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

  fetchContentDetails = async (req, res, next) => {
    try {
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      const range = req.headers.range;
      const contentId = req.params.contentId;

      if (!range || !contentId) {
        res.status(400);
        throw new Error('Missing required parameters');
      }

      const contentInfo = await content.findOne({
        _id: contentId,
        isDeleted: false,
      });

      if (!contentInfo) {
        res.status(404);
        throw new Error('Content not found');
      }

      // Default indices for movies
      let seasonIndex = 0;
      let episodeIndex = 0;

      // If it's a series, read the requested season and episode from the query parameters.
      // Example frontend request: /api/content/6a0c...?season=1&episode=3
      if (contentInfo.contentType === 'series') {
        seasonIndex = parseInt(req.query.season || '0', 10);
        episodeIndex = parseInt(req.query.episode || '0', 10);
      }

      // Safety check: Ensure the requested season and episode actually exist in the array
      if (
        !contentInfo.contentIds[seasonIndex] ||
        !contentInfo.contentIds[seasonIndex][episodeIndex]
      ) {
        res.status(404);
        throw new Error('Requested season or episode does not exist');
      }

      // Fetch the correct bucket dynamically
      const bucketInfo = await bucket.findOne({
        _id: contentInfo.contentIds[seasonIndex][episodeIndex],
      });

      if (!bucketInfo) {
        res.status(404);
        throw new Error('Bucket metadata not found for this content');
      }

      const contentSize = bucketInfo.size_byte;
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : contentSize - 1;

      const startChunk = Math.floor(start / chunkSize);
      const endChunk = Math.floor(end / chunkSize);

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${contentSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Type': getMimeType(bucketInfo.mimeType),
        'Content-Length': end - start + 1,
      });

      for (let i = startChunk; i <= endChunk; i++) {
        const chunkUrl = `${bucketInfo.baseUrl}${i}`;

        const chunkStart = i * chunkSize;
        const offsetStart = i === startChunk ? start - chunkStart : 0;
        const offsetEnd = i === endChunk ? end - chunkStart : chunkSize - 1;

        try {
          const response = await axios({
            method: 'GET',
            url: chunkUrl,
            responseType: 'stream',
            headers: {
              Range: `bytes=${offsetStart}-${offsetEnd}`,
            },
          });

          await new Promise((resolve, reject) => {
            response.data.pipe(res, { end: false });
            response.data.on('end', resolve);
            response.data.on('error', reject);
          });
        } catch (streamError) {
          console.error(`Failed to fetch ${chunkUrl}:`, streamError.message);
          if (!res.writableEnded) res.end();
          return;
        }
      }

      if (!res.writableEnded) {
        res.end();
      }
    } catch (err) {
      if (res.headersSent) {
        if (!res.writableEnded) res.end();
      } else {
        next(err);
      }
    }
  };

  contact = async (req, res, next) => {
    try {
      const { name, email, message, isSubscribed } = req.body;

      const newContact = await contact.create({
        name,
        email,
        message,
        isSubscribed,
      });

      mailer.contactMailer(name, email, message, isSubscribed);

      res.status(200).json({
        message: 'Message sent successfully',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };
}
