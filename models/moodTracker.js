const mongoose = require("mongoose");

const moodTrackerSchema = new mongoose.Schema({
  moodStatus: [
    {
      id: {
        type: String,
        required: true,
      },
      moodType: {
        type: String,
        required: false,
      },
      moodImgUrl: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MoodTracker = mongoose.model("MoodTracker", moodTrackerSchema);

module.exports = MoodTracker;
