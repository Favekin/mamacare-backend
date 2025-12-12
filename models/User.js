// backend/models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, default: null }, // null for Google-only accounts
  googleId: { type: String, default: null }, // Google subject id
  name: { type: String, default: null },
  avatar: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
