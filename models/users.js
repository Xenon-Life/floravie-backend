const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String, // Make password non-required for Google OAuth users
  },
  googleId: {
    type: String, // Store Google ID for OAuth users
  },
  age: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "doctor"],
    required: true,
    default: "user",
  },
  country: {
    type: String,
    required: function () {
      return this.role === "doctor";
    },
  },
  practice: {
    type: String,
    required: function () {
      return this.role === "doctor";
    },
  },
  isFirstTimeUser: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a model using the schema
const Users = mongoose.model("Users", userSchema);

module.exports = Users;
