import dotenv from 'dotenv';

dotenv.config();

const configuration = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  MAIL_SERVICE: process.env.MAIL_SERVICE,
  MAIL_USER: process.env.MAIL_USER,
  FRONTEND_URL: process.env.FRONTEND_URL,
  MAIL_PASS: process.env.MAIL_PASS,
  ACCESS_SECRET: process.env.ACCESS_SECRET,
  REFRESH_SECRET: process.env.REFRESH_SECRET,
  ACCESS_EXPIRE: process.env.ACCESS_EXPIRE,
  REFRESH_EXPIRE: process.env.REFRESH_EXPIRE,
  CORS: {
    origin: `${process.env.FRONTEND_URL}`,
    methods: ['POST', 'GET'],
  },
};

export default configuration;
