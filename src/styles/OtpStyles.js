export default class OtpStyles {
  otpStyles = () => {
    return `body {
                    margin: 0;
                    padding: 0;
                    background: #000;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                }

                /* Card */
                .container {
                    max-width: 480px;
                    margin: 60px auto;
                    background: #0d0d0d;
                    border-radius: 24px;
                    padding: 40px 32px;
                    box-shadow: 0 30px 80px rgba(0,0,0,0.9);
                    border: 1px solid rgba(255,255,255,0.05);
                }

                /* Logo */
                .logo {
                    font-size: 18px;
                    font-weight: 700;
                    color: #fff;
                    letter-spacing: 1px;
                    margin-bottom: 30px;
                }

                .logo span {
                    color: #facc15;
                }

                /* Title */
                .title {
                    font-size: 26px;
                    font-weight: 700;
                    color: #ffffff;
                    margin-bottom: 10px;
                }

                /* Subtitle */
                .subtitle {
                    font-size: 14px;
                    color: #9ca3af;
                    line-height: 1.6;
                    margin-bottom: 40px;
                }

                /* OTP Box */
                .otp-container {
                    background: #000;
                    border-radius: 18px;
                    padding: 20px;
                    text-align: center;
                    border: 1px solid rgba(250,204,21,0.3);
                }

                .otp {
                    font-size: 40px;
                    font-weight: 700;
                    letter-spacing: 10px;
                    color: #facc15;
                }

                /* Divider */
                .line {
                    height: 1px;
                    background: rgba(255,255,255,0.06);
                    margin: 35px 0;
                }

                /* Footer text */
                .footer-text {
                    font-size: 13px;
                    color: #6b7280;
                    line-height: 1.6;
                }

                .highlight {
                    color: #facc15;
                }

                /* Warning */
                .warning {
                    margin-top: 15px;
                    font-size: 12px;
                    color: #ef4444;
                }

                /* Small brand footer */
                .brand-footer {
                    margin-top: 30px;
                    font-size: 12px;
                    color: #4b5563;
                }

                .brand-footer span {
                    color: #facc15;
                }

                @media (max-width: 600px) {
                    .container {
                        margin: 20px;
                        padding: 30px 20px;
                    }

                    .otp {
                        font-size: 32px;
                        letter-spacing: 6px;
                    }
                }
        `;
  };

  adminOtpStyles = () => {
    return `
            /* Base Styles */
                body {
                    font-family: 'Roboto Condensed', Arial, sans-serif;
                    background-color: #0a0a0a;
                    color: white;
                    margin: 0;
                    padding: 0;
                    line-height: 1.6;
                }
                
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #222222;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .header {
                    background-color: rgba(10, 10, 10, 0.9);
                    padding: 20px;
                    text-align: center;
                    border-bottom: 2px solid #9ee600;
                }
                
                .logo {
                    font-family: 'Oswald', Arial, sans-serif;
                    color: white;
                    font-size: 24px;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
                
                .logo-accent {
                    color: #9ee600;
                }
                
                .content {
                    padding: 30px;
                }
                
                h1 {
                    font-family: 'Oswald', Arial, sans-serif;
                    color: white;
                    margin-top: 0;
                    font-size: 24px;
                }
                
                p {
                    margin-bottom: 20px;
                    color: rgba(255, 255, 255, 0.8);
                }
                
                .otp-container {
                    background-color: #333333;
                    padding: 20px;
                    border-radius: 6px;
                    text-align: center;
                    margin: 30px 0;
                }
                
                .otp-code {
                    font-family: 'Oswald', Arial, sans-serif;
                    font-size: 32px;
                    letter-spacing: 5px;
                    color: #9ee600;
                    font-weight: bold;
                    margin: 15px 0;
                }
                
                .button {
                    display: inline-block;
                    background-color: #9ee600;
                    color: black;
                    text-decoration: none;
                    padding: 12px 25px;
                    border-radius: 4px;
                    font-family: 'Oswald', Arial, sans-serif;
                    font-weight: bold;
                    margin: 20px 0;
                }
                
                .footer {
                    background-color: #222222;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.6);
                    border-top: 1px solid #333333;
                }
                
                .divider {
                    height: 1px;
                    background-color: #333333;
                    margin: 20px 0;
                }
                
                /* Responsive */
                @media screen and (max-width: 600px) {
                    .container {
                        width: 100%;
                        border-radius: 0;
                    }
                    
                    .content {
                        padding: 20px;
                    }
                }
        `;
  };
}
