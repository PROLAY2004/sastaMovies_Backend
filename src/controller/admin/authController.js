import user from '../../models/userModel.js';

export default class AuthController {
  signup = async (req, res, next) => {
    try {
      const { name, email, days } = req.body;
      const validTill = new Date();
      const isUser = await user.findOne({ email: req.body.email });

      if (isUser) {
        res.status(400);

        throw new Error('Email already exists.');
      }

      validTill.setDate(validTill.getDate() + days);
      const newUser = new user({ name, email, validTill });
      await newUser.save();

      res.status(200).json({
        message: 'Invitation sent successfully.',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };
}
