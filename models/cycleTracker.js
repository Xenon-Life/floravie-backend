const mongoose = require("mongoose");

const cycleTrackerSchema = new mongoose.Schema({
  cycleHistory: [
    {
      date: {
        type: String,
        required: true,
      },
      symptom: {
        type: String,
        required: false,
      },
      trackerType: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  averageCycleLength: {
    type: Number,
    required: false,
  },
  averagePeriodLength: {
    type: Number,
    required: false,
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CycleTracker = mongoose.model("CycleTracker", cycleTrackerSchema);

module.exports = CycleTracker;
