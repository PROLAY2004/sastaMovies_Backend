import axios from 'axios';

import user from '../../models/userModel.js';
import content from '../../models/contentModel.js';
import bucket from '../../models/bucketModel.js';
import DateFormatter from '../../utils/DateFormatter.js';
import SendEmailService from '../../services/sendMailService.js';
import configuration from '../../config/config.js';

const mailer = new SendEmailService();
const format = new DateFormatter();

export default class AdminController {
  invite = async (req, res, next) => {
    try {
      const { name, email, days } = req.body;
      const validTill = new Date();
      const isUser = await user.findOne({ email });

      if (isUser) {
        res.status(400);

        throw new Error('Email already exists.');
      }

      validTill.setDate(validTill.getDate() + days);
      const newUser = new user({ name, email, validTill });
      await newUser.save();

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

  addMovie = async (req, res, next) => {
    try {
      const {
        imdbLink,
        posterLink,
        baseUrl,
        totalChunks,
        totalSize,
        mimeType,
        subtitleLink,
      } = req.body;
      const imdbId = imdbLink.split('/title/')[1].split('/')[0];
      const imdbApi = `https://www.omdbapi.com/?i=${imdbId}&apikey=${configuration.IMDB_API_KEY}`;
      const response = await axios.get(imdbApi);
      const isExists = await content.findOne({ imdbId });

      if (isExists) {
        res.status(400);
        throw new Error('Movie already exists.');
      }
      
      const bucketInstance = await bucket.create({
        imdbId,
        baseUrl,
        chunkCount: totalChunks,
        size_kb: totalSize,
        mimeType : mimeType.toLowerCase(),
      });

      

      await content.create({
        imdbId,
        title: response.data.Title,
        description: response.data.Plot,
        release: response.data.Released,
        cast: response.data.Actors.split(', '),
        runtime: response.data.Runtime,
        rating: parseFloat(response.data.imdbRating),
        posterUrl: {
          horizontal: posterLink,
          vertical: response.data.Poster,
        },
        contentType: 'movie',
        subtitleUrl: subtitleLink,
        contentIds: [bucketInstance._id],
      });

      res.status(200).json({
        message: 'Movie added successfully.',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };
}
