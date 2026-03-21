import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    otp: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const otp = mongoose.model('userOtp', otpSchema);
export default otp;
