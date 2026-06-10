import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    contentId: {
      type: String,
      required: true,
    },

    contentName: {
      type: String,
      required: true,
    },

    contentType: {
      type: String,
      required: true,
      enum: ['movie', 'series'],
      default: 'movie',
    },

    seasonNumber: {
        type: Number,
        default: 0,
        required: true,
    },

    episodeNumber: {
        type: Number,
        default: 0,
        required: true,
    },

    lastPosition: {
      type: Number,
      default: 0,
      required: true,
    },

    duration: {
      type: Number,
      default: 0,
      required: true,
    },

    watchPercentage: {
      type: Number,
      default: 0,
      required: true,
    },

    isCompleted: {
      type: Boolean,
      default: false,
      required: true,
    },

    watchCount: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const progress = mongoose.model('progress', progressSchema);
export default progress;
