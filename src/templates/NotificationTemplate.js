import NotificationStyles from '../styles/NotificationStyles.js';
import configuration from '../config/config.js';

const style = new NotificationStyles();

export default class NotificationTemplate {
  activationTemplate = (userName, startDate, expiryDate) => {
    return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
                    <title>Account Activated</title>

                    <style>
                        ${style.activationStyle()}
                    </style>
                </head>

                <body>
                    <div class="container">

                        <!-- Logo -->
                        <div class="logo">
                            SASTA <span>MOVIES</span>
                        </div>

                        <!-- Title -->
                        <div class="title">
                            🎉 Your account is now active
                        </div>

                        <!-- Subtitle -->
                        <div class="subtitle">
                            Welcome ${userName}, your access to unlimited entertainment is now unlocked.
                        </div>

                        <!-- Status Box -->
                        <div class="status-box">
                            <div class="badge">ACTIVE PLAN</div>

                            <div class="plan">
                                From ${startDate}
                            </div>

                            <div class="expiry">
                                Valid till <b>${expiryDate}</b>
                            </div>
                        </div>

                        <!-- CTA -->
                        <div style="text-align:center;">
                            <a href="${configuration.FRONTEND_URL}" class="btn">
                                Start Watching 🍿
                            </a>
                        </div>

                        <!-- Divider -->
                        <div class="line"></div>

                        <!-- Footer -->
                        <div class="footer-text">
                            Enjoy thousands of movies, personalized recommendations, and seamless streaming.
                        </div>

                        <div class="brand-footer">
                            © 2026 <span>Sasta Movies</span>
                        </div>
                    </div>
                </body>
            </html>`;
  };

  renewalTemplate = (userName, previousExpiryDate, expiryDate) => {
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Renewed</title>

        <style>
          ${style.activationStyle()}
        </style>
      </head>

      <body>
        <div class="container">

          <!-- Logo -->
          <div class="logo">
            SASTA <span>MOVIES</span>
          </div>

          <!-- Title -->
          <div class="title">
            🔄 Subscription Renewed Successfully
          </div>

          <!-- Subtitle -->
          <div class="subtitle">
            Hey ${userName}, your subscription has been successfully extended. Keep enjoying uninterrupted entertainment.
          </div>

          <!-- Status Box -->
          <div class="status-box">
            <div class="badge">PLAN EXTENDED</div>

            <div class="plan">
              Renewed From ${previousExpiryDate}
            </div>

            <div class="expiry">
              Now valid till <b>${expiryDate}</b>
            </div>
          </div>

          <!-- CTA -->
          <div style="text-align:center;">
            <a href="${configuration.FRONTEND_URL}" class="btn">
              Continue Watching 🍿
            </a>
          </div>

          <!-- Divider -->
          <div class="line"></div>

          <!-- Footer -->
          <div class="footer-text">
            Your binge continues without interruption. Dive back into your favorite movies and series anytime.
          </div>

          <div class="brand-footer">
            © 2026 <span>Sasta Movies</span>
          </div>

        </div>
      </body>
      </html>`;
  };

  adminUpgradeTemplate = (userName) => {
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Access Granted</title>

        <style>
          ${style.activationStyle()}
        </style>
      </head>

      <body>
        <div class="container">

          <!-- Logo -->
          <div class="logo">
            SASTA <span>MOVIES</span>
          </div>

          <!-- Title -->
          <div class="title">
            🛡️ Admin Access Granted
          </div>

          <!-- Subtitle -->
          <div class="subtitle">
            Hello ${userName}, your account has been upgraded with administrator privileges.
          </div>

          <!-- Status Box -->
          <div class="status-box">
            <div class="badge">ADMIN ROLE</div>

            <div class="plan">
              Elevated Permissions Enabled
            </div>

            <div class="expiry">
              You now have access to manage content, users, and system settings.
            </div>
          </div>

          <!-- CTA -->
          <div style="text-align:center;">
            <a href="${configuration.ADMIN_URL}" class="btn">
              Go to Admin Panel ⚙️
            </a>
          </div>

          <!-- Divider -->
          <div class="line"></div>

          <!-- Footer -->
          <div class="footer-text">
            With great power comes responsibility. Please ensure actions are performed carefully within the admin panel.
          </div>

          <div class="brand-footer">
            © 2026 <span>Sasta Movies</span>
          </div>

        </div>
      </body>
      </html>`;
  };

  contactTemplate = (name, email, message, newsletterSubscribed) => {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <title>Contact Request Received</title>

      <style>
        ${style.activationStyle()}
      </style>
    </head>

    <body>
      <div class="container">

        <!-- Logo -->
        <div class="logo">
          SASTA <span>MOVIES</span>
        </div>

        <!-- Title -->
        <div class="title">
          📩 We Received Your Message
        </div>

        <!-- Subtitle -->
        <div class="subtitle">
          Hey ${name}, thanks for contacting us. Our team will review your message and get back to you shortly.
        </div>

        <!-- Status Box -->
        <div class="status-box">

          <div class="badge">
            CONTACT REQUEST
          </div>

          <div class="plan" style="font-size:16px; margin-bottom:16px;">
            ${email}
          </div>

          <div style="
            text-align:left;
            background:#111;
            border-radius:14px;
            padding:16px;
            color:#d1d5db;
            font-size:14px;
            line-height:1.7;
            word-break:break-word;
          ">
            ${message}
          </div>

          <div class="expiry" style="margin-top:16px;">
            Newsletter Subscription:
            <b>
              ${newsletterSubscribed ? 'Subscribed' : 'Not Subscribed'}
            </b>
          </div>

        </div>

        <!-- CTA -->
        <div style="text-align:center;">
          <a href="${configuration.FRONTEND_URL}" class="btn">
            Visit Website 🌐
          </a>
        </div>

        <!-- Divider -->
        <div class="line"></div>

        <!-- Footer -->
        <div class="footer-text">
          Our support team usually replies within 24 hours.
        </div>

        <div class="brand-footer">
          © 2026 <span>Sasta Movies</span>
        </div>

      </div>
    </body>
    </html>`;
  };

  adminContactTemplate = (name, email, messageId) => {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Request</title>

      <style>
        ${style.activationStyle()}
      </style>
    </head>

    <body>
      <div class="container">

        <!-- Logo -->
        <div class="logo">
          SASTA <span>MOVIES</span>
        </div>

        <!-- Title -->
        <div class="title">
          🚨 New Contact Form Submission
        </div>

        <!-- Subtitle -->
        <div class="subtitle">
          A new user has submitted a contact request from the website.
        </div>

        <!-- Status Box -->
        <div class="status-box">

          <div class="badge">
            NEW MESSAGE
          </div>

          <div style="
            text-align:left;
            margin-top:18px;
            color:#d1d5db;
            line-height:1.9;
            font-size:14px;
          ">

            <div>
              <b style="color:#fff;">Name:</b>
              ${name}
            </div>

            <div>
              <b style="color:#fff;">Email:</b>
              ${email}
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div style="text-align:center;">
          <a href="${configuration.ADMIN_URL}/responses/${messageId}" class="btn" style="color : #000"; text-decoration:none; >
            View Message 📧
          </a>
        </div>

        <!-- Divider -->
        <div class="line"></div>

        <!-- Footer -->
        <div class="footer-text">
          This notification was generated automatically from the contact form system.
        </div>

        <div class="brand-footer">
          © 2026 <span>Sasta Movies</span>
        </div>

      </div>
    </body>
    </html>`;
  };
}
