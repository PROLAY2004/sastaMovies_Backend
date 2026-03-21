import dotenv from 'dotenv';

dotenv.config();

const configuration = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  MAIL_SERVICE: process.env.MAIL_SERVICE,
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASS: process.env.MAIL_PASS,
  CORS: {
    origin: `${process.env.FRONTEND_URL}`,
    methods: ['POST', 'GET'],
  },
};

export default configuration;
