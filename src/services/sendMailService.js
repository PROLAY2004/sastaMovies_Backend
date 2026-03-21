import nodemailer from 'nodemailer';
import configuration from '../config/config.js';
import otpTemplate from '../templates/otpTemplatre.js';

export default class SendEmailService {
  // Common mail sender
  mailSender = async (email, title, body) => {
    try {
      const transporter = nodemailer.createTransport({
        service: configuration.MAIL_SERVICE,
        auth: {
          user: configuration.MAIL_USER,
          pass: configuration.MAIL_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: 'Admin - Tracker79',
        to: email,
        subject: title,
        html: body,
      });

      return info;
    } catch (error) {
      return error;
    }
  };

  otpMailer = async (email, otp, method) => {
    try {
      const mailResponse = await this.mailSender(
        email,
        'Verification Email',
        otpTemplate(otp, method)
      );

      if (mailResponse instanceof Error) {
        throw mailResponse;
      }
    } catch (error) {
      throw error;
    }
  };
}
