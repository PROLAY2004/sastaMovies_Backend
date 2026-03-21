import jwt from 'jsonwebtoken';

export default function verifyToken(req, secret) {
  try {
    return jwt.verify(req.headers.authorization.split(' ')[1], secret);
  } catch (err) {
    throw err;
  }
}
