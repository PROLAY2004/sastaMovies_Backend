import otpStyles from '../styles/otpStyles.js';

export default function otpTemplate(otp) {
  return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
                <title>Sasta Movies OTP</title>

                <style>
                    ${otpStyles()}
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
                        Verify your account
                    </div>

                    <!-- Subtitle -->
                    <div class="subtitle">
                        Enter the verification code below to continue.<br>
                        This code will expire in <span class="highlight">10 minutes</span>.
                    </div>

                    <!-- OTP -->
                    <div class="otp-container">
                        <div class="otp">${otp}</div>
                    </div>

                    <!-- Divider -->
                    <div class="line"></div>

                    <!-- Footer -->
                    <div class="footer-text">
                        If you didn’t request this, you can safely ignore this email.
                    </div>

                    <div class="warning">
                        Never share your OTP with anyone.
                    </div>

                    <div class="brand-footer">
                        © 2026 <span>Sasta Movies</span>
                    </div>

                </div>
            </body>
        </html>`;
}
