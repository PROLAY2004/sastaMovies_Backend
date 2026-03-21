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
}
