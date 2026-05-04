import nodemailer from 'nodemailer';
import configuration from '../config/config.js';
import OtpTemplate from '../templates/OtpTemplate.js';
import NotificationTemplate from '../templates/NotificationTemplate.js';

const template = new NotificationTemplate();
const otpTemplate = new OtpTemplate();
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

  activationMailer = async (name, email, startDate, expireDate) => {
    try {
      const mailResponse = await this.mailSender(
        email,
        'Account Activated',
        template.activationTemplate(name, startDate, expireDate)
      );

      if (mailResponse instanceof Error) {
        throw mailResponse;
      }
    } catch (error) {
      throw error;
    }
  };

  renewalMailer = async (name, email, previousExpiryDate, expireDate) => {
    try {
      const mailResponse = await this.mailSender(
        email,
        'Subscription extented',
        template.renewalTemplate(name, previousExpiryDate, expireDate)
      );

      if (mailResponse instanceof Error) {
        throw mailResponse;
      }
    } catch (error) {
      throw error;
    }
  };

  upgradeMailer = async (name, email) => {
    try {
      const mailResponse = await this.mailSender(
        email,
        'User Upgraded to Admin',
        template.adminUpgradeTemplate(name)
      );

      if (mailResponse instanceof Error) {
        throw mailResponse;
      }
    } catch (error) {
      throw error;
    }
  };

  otpMailer = async (email, otp, userType) => {
    try {
      let mailResponse;

      if (userType === 'admin') {
        mailResponse = await this.mailSender(
          email,
          'Verification Email',
          otpTemplate.adminOtpTemplate(otp)
        );
      } else {
        mailResponse = await this.mailSender(
          email,
          'Verification Email',
          otpTemplate.otpTemplate(otp)
        );
      }

      if (mailResponse instanceof Error) {
        throw mailResponse;
      }
    } catch (error) {
      throw error;
    }
  };
}
