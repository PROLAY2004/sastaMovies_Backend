import otp from '../models/otpModel.js';
import SendEmailService from '../services/sendMailService.js';

const mailer = new SendEmailService();

export default async function otpGenerator(res, email, userType = 'user') {
  try {
    const newOtp = Math.floor(100000 + Math.random() * 900000);
    const latestOtp = await otp.findOne({ email }).sort({ createdAt: -1 });

    if (latestOtp) {
      const remainingTime = Date.now() - latestOtp.createdAt.getTime();

      if (remainingTime < 2 * 60 * 1000) {
        const minutes = Math.ceil(
          (2 * 60 * 1000 - remainingTime) / (1000 * 60)
        );

        res.status(425);
        throw new Error(`Please try after ${minutes} minutes`);
      }
    }

    await otp.create({
      otp: newOtp,
      email,
    });

    await mailer.otpMailer(email, newOtp, userType);
  } catch (err) {
    throw err;
  }
}
