import user from '../models/userModel.js';

export default class AuthController {
  signup = async (req, res, next) => {
    try {
      const isUser = await user.findOne({ email: req.body.email });
      req.body.password = await bcrypt.hash(req.body.password, 10);

      if (isUser && isUser.isVerified) {
        res.status(400);

        throw new Error('Email already registered.');
      }

      await user.findOneAndUpdate(
        { email: req.body.email },
        { $set: req.body },
        { upsert: true, new: true, runValidators: true }
      );

      await sendOtp(req.body.email, 'signup');

      res.status(200).json({
        message: 'Verification OTP sent to email.',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };
}
