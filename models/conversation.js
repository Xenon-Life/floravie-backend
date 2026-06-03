const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },
  ],
  type: {
    type: String,
    enum: ["group", "dm"],
    default: "group",
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CommunityPost",
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;

