const mongoose = require("mongoose");

const symptomsTrackerSchema = new mongoose.Schema({
  symptoms: [
    {
      id: {
        type: Number,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      emojiUrl: {
        type: String,
        required: true,
      },
      stars: {
        type: Number,
        default: 0,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  flow: [
    {
      id: {
        type: Number,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      stars: {
        type: Number,
        default: 0,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  discharge: [
    {
      id: {
        type: Number,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },

      stars: {
        type: Number,
        default: 0,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  reports: [
    {
      type: String,
      required: false,
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

const SymptomsTracker = mongoose.model(
  "SymptomsTracker",
  symptomsTrackerSchema
);
module.exports = SymptomsTracker;
