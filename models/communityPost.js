const mongoose = require("mongoose");

const communityPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 4000,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

const CommunityPost = mongoose.model("CommunityPost", communityPostSchema);

module.exports = CommunityPost;

