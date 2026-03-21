import UserSchema from '../schema/UserSchema.js';
import { ValidationError } from 'yup';

const schema = new UserSchema();

export default class UserValidation {
  signupRequest = async (req, res, next) => {
    try {
      await schema.userSignupSchema.validate(req.body, {
        abortEarly: false, // return all validation errors
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

  //   signinRequest = async (req, res, next) => {
  //     try {
  //       await schema.userLoginSchema.validate(req.body, {
  //         abortEarly: false, // return all validation errors
  //         stripUnknown: true, // remove unexpected fields
  //       });

  //       next();
  //     } catch (err) {
  //       if (err instanceof ValidationError) {
  //         res.status(400);
  //         next(new Error(err.errors.join(', ')));
  //       }

  //       next(err);
  //     }
  //   };

  //   resetRequest = async (req, res, next) => {
  //     try {
  //       await schema.userResetPasswordSchema.validate(req.body, {
  //         abortEarly: false, // return all validation errors
  //         stripUnknown: true, // remove unexpected fields
  //       });

  //       next();
  //     } catch (err) {
  //       if (err instanceof ValidationError) {
  //         res.status(400);
  //         next(new Error(err.errors.join(', ')));
  //       }

  //       next(err);
  //     }
  //   };
}
