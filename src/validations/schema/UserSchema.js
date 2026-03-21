import * as yup from 'yup';

export default class UserSchema {
  userSignupSchema = yup.object({
    name: yup.string().required('Please enter your name.'),
    email: yup.string().required('Please enter your email.'),
    days: yup.string().required('Please enter day count'),
  });

  //   userSignupVerifySchema = yup.object({
  //     email: yup.string().required('Please enter your email.'),
  //     userOtp: yup.string().required('Please enter the OTP sent to your email.'),
  //   });

  //   userLoginSchema = yup.object({
  //     email: yup.string().required('Please enter your email.'),
  //     password: yup.string().required('Please enter your password.'),
  //   });

  //   userResetPasswordSchema = yup.object({
  //     email: yup.string().required('Please enter your email.'),
  //     userOtp: yup.string().required('Please enter the OTP sent to your email.'),
  //     newPassword: yup.string().required('Please enter your new password.'),
  //   });
}
