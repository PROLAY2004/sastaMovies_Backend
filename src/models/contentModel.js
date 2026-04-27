import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema(
  {
    imdbUrl: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    cast: {
      type: [String],
      required: true,
    },

    runtime: {
      type: String,
      required: true,
    },

    rating: {
      type: Number,
      required: true,
    },

    posterUrl: {
      16_9: {
        type: String,
        required: true,
      },
      9_16: {
        type: String,
        required: true,
      },
    },

    contentType: {
      type: String,
      required: true,
      enum: ['movie', 'series'],
    },

    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },

    subtitleUrl: {
      type: String,
      required: true,
      default: '',
    },

    contentIds: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const content = mongoose.model('content', contentSchema);
export default content;
