import * as yup from 'yup';

export default class UserSchema {
  inviteSchema = yup.object({
    name: yup
      .string()
      .trim()
      .strict(true)
      .required('Please enter your name.')
      .min(2, 'Name must be at least 2 characters'),

    email: yup
      .string()
      .email('Enter a valid email address')
      .required('Please enter your email.'),

    date: yup
      .date()
      .typeError('Please enter a valid date')
      .min(
        new Date(new Date().setDate(new Date().getDate())),
        'Date must be at least tomorrow'
      )
      .required('Please enter date'),
  });
}
