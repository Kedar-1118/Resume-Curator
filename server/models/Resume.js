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
    projects: [
      {
        name: { type: String, default: '' },
        description: { type: String, default: '' },
        technologies: { type: String, default: '' },
        link: { type: String, default: '' },
        bullets: [{ type: String }],
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
    // ─── JD Intelligence (Feature 3) ─────────────────────────
    parsedJD: {
      company: { type: String, default: '' },
      roleTitle: { type: String, default: '' },
      level: {
        type: String,
        enum: ['intern', 'junior', 'mid', 'senior', 'lead', 'executive', ''],
        default: '',
      },
      industry: { type: String, default: '' },
      mustHaveSkills: [{ type: String }],
      niceToHaveSkills: [{ type: String }],
      parsedAt: { type: Date, default: null },
    },
    // ─── Version History (Feature 4) ─────────────────────────
    versions: [
      {
        savedAt: { type: Date, default: Date.now },
        snapshot: { type: Object },
      },
    ],
    // ─── Cover Letter (Feature 5) ────────────────────────────
    coverLetter: {
      salutation: { type: String, default: '' },
      opening: { type: String, default: '' },
      bodyParagraphs: [{ type: String }],
      closing: { type: String, default: '' },
      subject: { type: String, default: '' },
      generatedAt: { type: Date, default: null },
    },
    // ─── Multi-JD Targeting (Feature 6) ──────────────────────
    jdTargets: [
      {
        label: { type: String, default: '' },
        jdText: { type: String, default: '' },
        parsedJD: { type: Object },
        atsScore: { type: Number, default: null },
        scoredAt: { type: Date, default: null },
      },
    ],
    // ─── ATS Score History (Improvement C) ────────────────────
    atsScores: [
      {
        score: { type: Number },
        breakdown: {
          keywords: Number,
          actionVerbs: Number,
          quantification: Number,
          formatting: Number,
          sections: Number,
          contactInfo: Number,
          summaryRelevance: Number,
          readability: Number,
        },
        scoredAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Resume', resumeSchema);
