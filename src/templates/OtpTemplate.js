import OtpStyles from '../styles/OtpStyles.js';

const otpStyle = new OtpStyles();

export default class OtpTemplate {
  otpTemplate = (otp) => {
    return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
                <title>Sasta Movies OTP</title>

                <style>
                    ${otpStyle.otpStyles()}
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
  };

  adminOtpTemplate = (otp) => {
    return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Admin OTP for Sasta Movies</title>
                <style>
                    ${otpStyle.adminOtpStyles()}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">
                            <span class="logo-accent">Sasta</span>Movies
                        </div>
                    </div>
                    
                    <div class="content">
                        <h1>One-Time Password (OTP)</h1>
                        <p>Hello Admin,</p>
                        <p>We received a request to authenticate your account. Please use the following OTP to verify your identity:</p>
                        
                        <div class="otp-container">
                            <p>Your admin verification code is:</p>
                            <div class="otp-code">${otp}</div>
                            <p>This code will expire in 10 minutes.</p>
                        </div>
                        
                        <p>If you didn't request this OTP, please ignore this email or contact our support team immediately.</p>
                        
                        <div class="divider"></div>
                        
                        <p>For security reasons, please don't share this OTP with anyone.</p>
                        
                    
                    </div>
                    
                    <div class="footer">
                        <p>&copy; 2026 Sasta Movies. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>`;
  };
}
