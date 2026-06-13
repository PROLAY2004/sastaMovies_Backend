import jwt from 'jsonwebtoken';

import user from '../models/userModel.js';
import configuration from '../config/config.js';

const genAuthToken = async (userId, type = 'access') => {
  try {
    const access_token = jwt.sign({ userId }, configuration.ACCESS_SECRET, {
      expiresIn: configuration.ACCESS_EXPIRE,
    });
    const refresh_token = jwt.sign({ userId }, configuration.REFRESH_SECRET, {
      expiresIn: configuration.REFRESH_EXPIRE,
    });

    if (type === 'access') {
      await user.findByIdAndUpdate(userId, { lastLogin: Date.now() });
    }

    return {
      access_token,
      refresh_token,
    };
  } catch (err) {
    throw err;
  }
};

export default genAuthToken;
