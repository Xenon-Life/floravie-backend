const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
    index: true,
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;

