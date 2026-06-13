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

      const isUser = await user.findOne({
        email: req.body.email,
        isDeleted: false,
      });

      if (!isUser) {
        res.status(400);
        throw new Error('User does not exists or deleted.');
      }

      if (isUser.role !== 'admin' && !isUser.isSuperAdmin) {
        res.status(400);
        throw new Error('Access Denied. Admin only.');
      }

      if (isUser.isBlocked && !isUser.isSuperAdmin) {
        res.status(400);
        throw new Error('Admin blocked. Contact Support!');
      }

      await otpGenerator(res, req.body.email, 'admin');

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
      const userInfo = await user.findOne({
        email: userResponse.data.email,
        isDeleted: false,
      });

      if (!userInfo) {
        res.status(404);
        throw new Error('User does not exists or deleted');
      }

      if (userInfo.role !== 'admin' && !userInfo.isSuperAdmin) {
        res.status(400);
        throw new Error('Access Denied. Admin only.');
      }

      if (userInfo.isBlocked && !userInfo.isSuperAdmin) {
        res.status(400);
        throw new Error('Admin Blocked. Contact Support!');
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

      if (userInfo.role !== 'admin' && !userInfo.isSuperAdmin) {
        res.status(401);
        throw new Error('Access Denied. Admin only.');
      }

      const tokens = await genAuthToken(userInfo._id, 'refresh');

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
