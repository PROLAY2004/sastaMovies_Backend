import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema(
  {
    imdbId: {
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

    release: {
      type: String,
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

    genre: {
      type: [String],
      required: true,
    },

    posterUrl: {
      horizontal: {
        type: String,
        required: true,
      },
      vertical: {
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
