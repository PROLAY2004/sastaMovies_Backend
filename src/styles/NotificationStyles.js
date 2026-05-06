export default class NotificationStyles {
  activationStyle = () => {
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
                    margin-bottom: 35px;
                }

                /* Status Box */
                .status-box {
                    background: #000;
                    border-radius: 18px;
                    padding: 22px;
                    text-align: center;
                    border: 1px solid rgba(250,204,21,0.3);
                }

                /* Badge */
                .badge {
                    display: inline-block;
                    padding: 6px 14px;
                    border-radius: 999px;
                    background: rgba(250,204,21,0.1);
                    color: #facc15;
                    font-size: 12px;
                    margin-bottom: 12px;
                }

                /* Plan Text */
                .plan {
                    font-size: 20px;
                    font-weight: 600;
                    color: #fff;
                }

                /* Expiry */
                .expiry {
                    font-size: 13px;
                    color: #9ca3af;
                    margin-top: 6px;
                }

                /* Button */
                .btn {
                    display: inline-block;
                    margin-top: 30px;
                    padding: 12px 26px;
                    background: #facc15;
                    color: #000;
                    border-radius: 12px;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 14px;
                }

                /* Divider */
                .line {
                    height: 1px;
                    background: rgba(255,255,255,0.06);
                    margin: 35px 0;
                }

                /* Footer */
                .footer-text {
                    font-size: 13px;
                    color: #6b7280;
                    line-height: 1.6;
                }

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
                }`;
  };
}
