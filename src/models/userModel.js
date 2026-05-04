import mongoose from 'mongoose';

const usrSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    validTill: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      required: true,
      enum: ['user', 'admin'],
      default: 'user',
    },

    isBlocked: {
      type: Boolean,
      required: true,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    isSuperAdmin: {
      type: Boolean,
      default: false,
      required: true,
    },

    permission: {
      type: [String], // movies, series, users
      required: true,
      default: [],
    },

    savedContents: {
      type: [String],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const user = mongoose.model('userdata', usrSchema);
export default user;
