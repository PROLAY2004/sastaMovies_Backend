import user from '../../models/userModel.js';
import otpGenerator from '../../utils/genOtp.js';

export default class AuthController {
  signin = async (req, res, next) => {
    try {
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
}
