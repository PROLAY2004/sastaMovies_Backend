import axios from 'axios';
import user from '../../models/userModel.js';
import otp from '../../models/otpModel.js';
import otpGenerator from '../../utils/genOtp.js';
import genAuthToken from '../../utils/tokenGenerator.js';
import oauth2Client from '../../utils/googleClient.js';

export default class AuthController {
  signin = async (req, res, next) => {
    try {
      if (!req.body.email) {
        res.status(400);
        throw new Error('Enter your email to continue.');
      }

      const isUser = await user.findOne({ email: req.body.email });
      const now = new Date();

      if (!isUser) {
        res.status(400);
        throw new Error('User does not exists.');
      }

      if (isUser.isBlocked) {
        res.status(400);
        throw new Error('User blocked by admin.');
      }

      const expiryTime = new Date(isUser.validTill);

      if (now > expiryTime && isUser.role !== 'admin') {
        res.status(400);
        throw new Error('User subscription expired.');
      }

      await otpGenerator(res, req.body.email);

      res.status(200).json({
        message: 'OTP successfully sent to email.',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  verify = async (req, res, next) => {
    try {
      const email = req.params.email;
      const newOtp = req.body.otp;

      if (!email) {
        res.status(404);
        throw new Error('No Email Found.');
      }

      if (!newOtp) {
        res.status(400);
        throw new Error('Please enter 6 digit OTP.');
      }

      const latestOtp = await otp.findOne({ email }).sort({ createdAt: -1 });
      const otpTime = new Date(latestOtp.createdAt);

      if (latestOtp.otp !== newOtp) {
        res.status(400);
        throw new Error('Invalid OTP entered.');
      }

      if (Date.now() - otpTime > 600000) {
        res.status(400);
        throw new Error('The OTP has expired.');
      }

      const userinfo = await user.findOne({ email });
      const tokens = await genAuthToken(userinfo._id);

      res.status(200).json({
        message: 'User successfully logged in.',
        success: true,
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  google = async (req, res, next) => {
    try {
      const now = new Date();
      const googleCode = req.query.code;

      if (!googleCode) {
        res.status(404);
        throw new Error('No Code Found.');
      }

      const googleResponse = await oauth2Client.getToken(googleCode);
      oauth2Client.setCredentials(googleResponse.tokens);

      const userResponse = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleResponse.tokens.access_token}`
      );
      const userInfo = await user.findOne({ email: userResponse.data.email });

      if (!userInfo) {
        res.status(404);
        throw new Error('User does not exists');
      }

      if (userInfo.isBlocked) {
        res.status(400);
        throw new Error('User Blocked By admin');
      }

      const expiryTime = new Date(userInfo.validTill);

      if (now > expiryTime && userInfo.role !== 'admin') {
        res.status(400);
        throw new Error('User subscription expired.');
      }

      const tokens = await genAuthToken(userInfo._id);

      res.status(200).json({
        message: 'Google login successful.',
        success: true,
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req, res, next) => {
    try {
      const userInfo = req.user;
      const tokens = await genAuthToken(userInfo._id);

      res.status(200).json({
        message: 'Refresh Token successfully generated.',
        success: true,
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
