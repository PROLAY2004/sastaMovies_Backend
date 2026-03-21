import express from 'express';
import cors from 'cors';

import configuration from './config/config.js';
import errorHandler from './error/errorHandler.js';
import loggerMiddleware from './validations/middleware/loggerMiddleware.js';
import connectDB from './config/dbConfig.js';

await connectDB();

const app = express();
app.use(cors(configuration.CORS));

app.use(express.json());
app.use(loggerMiddleware);

app.use(errorHandler);

app.listen(configuration.PORT, () => {
  console.log(`sastaMovies listening on port ${configuration.PORT}`);
});
