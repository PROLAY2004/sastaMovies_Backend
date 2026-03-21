import mongoose from 'mongoose';
import configuration from './config.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(configuration.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);

    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
