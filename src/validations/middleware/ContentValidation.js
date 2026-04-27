import { ValidationError } from 'yup';
import ContentSchema from '../schema/ContentSchema.js';

const schema = new ContentSchema();

export default class ContentValidation {
  addMovieRequest = async (req, res, next) => {
    try {
      await schema.movieSchema.validate(req.body, {
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
}
