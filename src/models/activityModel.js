import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'userdata',
      required: true,
    },
    adminName: {
      type: String,
      required: true,
    },
    adminEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      // Examples: 'Add Movie', 'Edit Series', 'Delete Movie', 'Block User', 'Renew Subscription'
    },
    targetName: {
      type: String,
      required: true,
      // Examples: 'Tumbbad', 'john.doe@gmail.com'
    },
  },
  {
    timestamps: true,
  }
);

const Activity = mongoose.model('activity', activitySchema);
export default Activity;
