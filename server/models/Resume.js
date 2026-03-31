const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Untitled Resume',
    },
    personal: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    summary: {
      type: String,
      default: '',
    },
    experience: [
      {
        title: { type: String, default: '' },
        company: { type: String, default: '' },
        location: { type: String, default: '' },
        startDate: { type: String, default: '' },
        endDate: { type: String, default: '' },
        current: { type: Boolean, default: false },
        bullets: [{ type: String }],
      },
    ],
    education: [
      {
        degree: { type: String, default: '' },
        school: { type: String, default: '' },
        location: { type: String, default: '' },
        year: { type: String, default: '' },
        gpa: { type: String, default: '' },
      },
    ],
    skills: [{ type: String }],
    certifications: [{ type: String }],
    targetJD: {
      type: String,
      default: '',
    },
    atsScore: {
      type: Number,
      default: null,
    },
    atsBreakdown: {
      keywords: { type: Number, default: null },
      actionVerbs: { type: Number, default: null },
      quantification: { type: Number, default: null },
      formatting: { type: Number, default: null },
      sections: { type: Number, default: null },
      contactInfo: { type: Number, default: null },
      summaryRelevance: { type: Number, default: null },
      readability: { type: Number, default: null },
    },
    template: {
      type: String,
      enum: ['classic', 'modern', 'professional'],
      default: 'modern',
    },
    lastAnalyzed: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Resume', resumeSchema);
