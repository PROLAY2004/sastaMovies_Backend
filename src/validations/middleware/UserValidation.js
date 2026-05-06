import UserSchema from '../schema/UserSchema.js';
import { ValidationError } from 'yup';

const schema = new UserSchema();

export default class UserValidation {
  inviteRequest = async (req, res, next) => {
    try {
      await schema.inviteSchema.validate(req.body, {
        abortEarly: true, // return all validation errors
        stripUnknown: true, // remove unexpected fields
      });

      next();
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(400);
        next(new Error(err.errors.join(', ')));
      }

      next(err);
    }
  };
}
