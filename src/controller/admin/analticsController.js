import mongoose from 'mongoose';

import user from '../../models/userModel.js';
import progress from '../../models/progressModel.js';

export default class AnalyticsController {
  getAnalytics = async (req, res, next) => {
    try {
      const {
        userId,
        page = 1,
        limit = 5,
        filter = 'all',
        chartRange = '7days',
      } = req.body;

      if (!userId) {
        res.status(400);
        throw new Error('UserId is required');
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400);
        throw new Error('Invalid message ID format. Please check the URL.');
      }

      const userInfo = await user.findById(userId, '-password').lean();
      if (!userInfo) {
        res.status(404);
        throw new Error('User not found');
      }

      // 1. LIFETIME AGGREGATIONS
      const allProgress = await progress.find({ userId }).lean();

      let totalWatchSeconds = 0;
      let moviesCount = 0;
      let seriesCount = 0;
      let completedCount = 0;

      // Find Last Active Date (Absolute latest progress update)
      const latestProgress = [...allProgress].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      )[0];
      const lastActive = latestProgress ? latestProgress.updatedAt : null;
      const savedContentsCount = userInfo.savedContents
        ? userInfo.savedContents.length
        : 0;

      // 🚨 FIND ALL MULTIPLE ACTIVE STREAMS (Within last 120 seconds)
      const activeStreams = allProgress.filter((p) => {
        const lastPingTime = new Date(p.updatedAt).getTime();
        return Date.now() - lastPingTime < 120000;
      });

      const isOnline = activeStreams.length > 0;
      // Map to an array of formatted strings
      const currentWatching = activeStreams.map((p) => {
        return p.contentType === 'series'
          ? `${p.contentName} (S${p.seasonNumber + 1} E${p.episodeNumber + 1})`
          : p.contentName;
      });

      allProgress.forEach((item) => {
        totalWatchSeconds += item.lastPosition || 0;
        if (item.isCompleted) completedCount++;
        if (item.contentType === 'movie') moviesCount++;
        if (item.contentType === 'series') seriesCount++;
      });

      const totalWatchHours = (totalWatchSeconds / 3600).toFixed(1);
      const inProgressCount = allProgress.length - completedCount;

      // 2. DYNAMIC LINE CHART GENERATION
      const now = new Date();
      let lineLabels = [];
      let lineData = [];

      if (chartRange === '7days') {
        for (let i = 6; i >= 0; i--) {
          let d = new Date(now);
          d.setDate(d.getDate() - i);
          lineLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
          lineData.push(0);
        }
        allProgress.forEach((p) => {
          let diffDays = Math.ceil(
            Math.abs(now - new Date(p.updatedAt)) / (1000 * 60 * 60 * 24)
          );
          if (diffDays <= 7) {
            let idx = 6 - (diffDays - 1);
            if (idx >= 0 && idx < 7) lineData[idx] += p.lastPosition / 3600;
          }
        });
      } else if (chartRange === 'month') {
        lineLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        lineData = [0, 0, 0, 0];
        allProgress.forEach((p) => {
          let diffDays = Math.floor(
            (now - new Date(p.updatedAt)) / (1000 * 60 * 60 * 24)
          );
          if (diffDays < 28) {
            let weekIdx = 3 - Math.floor(diffDays / 7);
            lineData[weekIdx] += p.lastPosition / 3600;
          }
        });
      } else if (chartRange === 'year') {
        for (let i = 11; i >= 0; i--) {
          let d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          lineLabels.push(d.toLocaleDateString('en-US', { month: 'short' }));
          lineData.push(0);
        }
        allProgress.forEach((p) => {
          let pDate = new Date(p.updatedAt);
          let monthDiff =
            (now.getFullYear() - pDate.getFullYear()) * 12 +
            now.getMonth() -
            pDate.getMonth();
          if (monthDiff < 12 && monthDiff >= 0) {
            let idx = 11 - monthDiff;
            lineData[idx] += p.lastPosition / 3600;
          }
        });
      } else if (chartRange === 'lifetime') {
        let yearMap = {};
        allProgress.forEach((p) => {
          let y = new Date(p.updatedAt).getFullYear();
          if (!yearMap[y]) yearMap[y] = 0;
          yearMap[y] += p.lastPosition / 3600;
        });
        lineLabels = Object.keys(yearMap).sort();
        lineData = lineLabels.map((y) => yearMap[y]);
        if (lineLabels.length === 0) {
          lineLabels = [now.getFullYear().toString()];
          lineData = [0];
        }
      }

      lineData = lineData.map((v) => parseFloat(v.toFixed(2)));

      // 3. PAGINATED & FILTERED TABLE DATA
      let query = { userId };
      if (filter === 'movies') query.contentType = 'movie';
      if (filter === 'series') query.contentType = 'series';
      if (filter === 'completed') query.isCompleted = true;
      if (filter === 'in-progress') query.isCompleted = false;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [paginatedStreams, totalCount] = await Promise.all([
        progress
          .find(query)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        progress.countDocuments(query),
      ]);

      res.status(200).json({
        success: true,
        data: {
          userInfo: { ...userInfo, lastActive, savedContentsCount },
          activity: { isOnline, currentWatching }, // currentWatching is now an Array
          metrics: {
            totalWatchHours,
            moviesCount,
            seriesCount,
            totalUniqueStreams: allProgress.length,
          },
          charts: {
            lineData: { labels: lineLabels, data: lineData },
            completion: { completedCount, inProgressCount },
            typeSplit: { moviesCount, seriesCount },
          },
          table: {
            streams: paginatedStreams,
            totalPages: Math.ceil(totalCount / parseInt(limit)) || 1,
            currentPage: parseInt(page),
            totalRecords: totalCount,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
