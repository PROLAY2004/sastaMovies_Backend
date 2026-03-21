import jwt from 'jsonwebtoken';

export default function verifyToken(req, res, secret) {
  try {
    if (!req.headers.authorization) {
      res.status(404);
      throw new Error('No Token Found');
    }

    return jwt.verify(req.headers.authorization.split(' ')[1], secret);
  } catch (err) {
    throw err;
  }
}
