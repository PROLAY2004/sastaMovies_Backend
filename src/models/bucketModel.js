import mongoose from 'mongoose';

const bucketSchema = new mongoose.Schema(
  {
    imdbId: {
      type: String,
      required: true,
    },

    baseUrl: {
      type: String,
      required: true,
    },

    chunkCount: {
      type: Number,
      required: true,
    },

    size_kb: {
      type: Number,
      required: true,
    },

    mimeType: {
      type: String,
      required: true,
      enum: ['mp4', 'mkv', 'webm', 'mov', 'avi'],
    },
  },
  {
    timestamps: true,
  }
);

const bucket = mongoose.model('bucket', bucketSchema);
export default bucket;
