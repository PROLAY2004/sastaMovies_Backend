import user from '../../models/userModel.js';
import DateFormatter from '../../utils/DateFormatter.js';
import SendEmailService from '../../services/sendMailService.js';

const mailer = new SendEmailService();
const format = new DateFormatter();

export default class AuthController {
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
}
