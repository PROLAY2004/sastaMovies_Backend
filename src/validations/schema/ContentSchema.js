import * as yup from 'yup';

export default class ContentSchema {
  /* ================= MOVIE ================= */

  addMovieSchema = yup.object({
    imdbLink: yup
      .string()
      .url('Enter a valid IMDb link')
      .required('Please enter the IMDb link.'),

    posterLink: yup
      .string()
      .url('Enter a valid poster URL')
      .required('Please enter the poster link.'),

    baseUrl: yup
      .string()
      .url('Enter a valid base URL')
      .required('Please enter the base URL.'),

    totalChunks: yup
      .number()
      .transform((v, o) => (o === '' ? undefined : v))
      .typeError('Total chunks must be a number')
      .positive('Must be greater than 0')
      .integer('Must be an integer')
      .required('Please enter the chunk count.'),

    totalSize: yup
      .number()
      .transform((v, o) => (o === '' ? undefined : v))
      .typeError('Total size must be a number')
      .positive('Must be greater than 0')
      .required('Please enter total size'),

    mimeType: yup
      .string()
      .oneOf(['mp4', 'mkv', 'webm'], 'Invalid MIME type')
      .required('Please select the MIME type.'),

    subtitleLink: yup
      .string()
      .url('Enter a valid subtitle URL')
      .nullable()
      .notRequired(),
  });

  editMovieSchema = this.addMovieSchema.shape({
    contentId: yup.string().required('Please enter the contentId.'),
  });

  /* ================= SERIES ================= */

  episodeSchema = yup.object({
    baseUrl: yup
      .string()
      .url('Enter a valid URL')
      .required('Base URL is required'),

    totalChunks: yup
      .number()
      .transform((v, o) => (o === '' ? undefined : v))
      .typeError('Total chunks must be a number')
      .positive('Must be greater than 0')
      .integer('Must be an integer')
      .required('Total chunks is required'),

    totalSize: yup
      .number()
      .transform((v, o) => (o === '' ? undefined : v))
      .typeError('Total size must be a number')
      .positive('Must be greater than 0')
      .required('Total size is required'),

    mimeType: yup
      .string()
      .oneOf(['mp4', 'mkv', 'webm'], 'Invalid mime type')
      .required('Mime type is required'),

    subtitleLink: yup
      .string()
      .url('Enter a valid subtitle URL')
      .nullable()
      .notRequired(),
  });

  seasonSchema = yup.object({
    episodes: yup
      .array()
      .of(this.episodeSchema)
      .min(1, 'Each season must have at least 1 episode'),
  });

  addSeriesSchema = yup.object({
    imdbLink: yup
      .string()
      .url('Enter a valid IMDb link')
      .required('IMDb link is required'),

    posterLink: yup
      .string()
      .url('Enter a valid poster URL')
      .required('Poster link is required'),

    seasons: yup
      .array()
      .of(this.seasonSchema)
      .min(1, 'Add at least one season'),
  });
}
