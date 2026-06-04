const mongoose = require('mongoose');

const repoChunkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    repoId: {
      type: String,
      required: true,
    },
    repoName: String,
    repoUrl: String,
    pushedAt: Date,
    chunkType: {
      type: String,
      enum: ['metadata', 'readme_section', 'tech_detail'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    // Optional: commit activity for metadata chunks (Feature 7)
    commitActivity: [
      {
        week: Number,
        count: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient upsert operations
repoChunkSchema.index({ userId: 1, repoId: 1 });

module.exports = mongoose.model('RepoChunk', repoChunkSchema);
