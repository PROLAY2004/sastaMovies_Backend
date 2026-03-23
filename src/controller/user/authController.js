import user from '../../models/userModel.js';
import otp from '../../models/otpModel.js';
import otpGenerator from '../../utils/genOtp.js';
import genAuthToken from '../../utils/tokenGenerator.js';

export default class AuthController {
  signin = async (req, res, next) => {
    try {
      if (!req.body.email) {
        res.status(400);
        throw new Error('Please enter a email.');
      }

      const isUser = await user.findOne({ email: req.body.email });
      const now = new Date();
      const expiryTime = new Date(isUser.validTill);

      if (!isUser) {
        res.status(400);
        throw new Error('User does not exists.');
      }

      if (isUser.isBlocked) {
        res.status(400);
        throw new Error('User blocked by admin.');
      }

      if (now > expiryTime) {
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
        res.status(400);
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
}
