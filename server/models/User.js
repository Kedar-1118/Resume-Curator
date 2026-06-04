const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    // ─── GitHub Integration (Feature 1) ─────────────────────
    githubId: {
      type: String,
      default: null,
    },
    githubAccessToken: {
      type: String,
      default: null,
    },
    githubUsername: {
      type: String,
      default: null,
    },
    githubConnectedAt: {
      type: Date,
      default: null,
    },
    githubIngestionStatus: {
      type: String,
      enum: ['idle', 'running', 'done', 'error'],
      default: 'idle',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

module.exports = mongoose.model('User', userSchema);
