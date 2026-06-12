import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    isSubscribed: {
      type: Boolean,
      default: false,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readBy: {
      type: String,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const contact = mongoose.model('contact', contactSchema);
export default contact;
