import * as yup from 'yup';

export default class UserSchema {
  inviteSchema = yup.object({
    name: yup.string().required('Please enter your name.'),
    email: yup.string().required('Please enter your email.'),
    days: yup.string().required('Please enter day count'),
  });
}
