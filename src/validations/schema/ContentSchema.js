import * as yup from 'yup';

export default class ContentSchema {
  movieSchema = yup.object({
    imdbLink: yup.string().required('Please enter the IMDb link.'),
    description: yup.string().required('Please enter a description.'),
    posterLink: yup.string().required('Please enter the poster link.'),
    baseUrl: yup.string().required('Please enter the base URL.'),
    totalChunks: yup.number().required('Please enter the chunk count.'),
    totalSize: yup.number().required('Please enter the total size.'),
    mimeType: yup.string().required('Please enter the MIME type.'),
  });
}
