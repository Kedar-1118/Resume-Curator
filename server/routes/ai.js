const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const Resume = require('../models/Resume');
const gemini = require('../services/gemini');
const { extractText } = require('../services/fileParser');

// Multer config — memory storage, max 10MB, PDF/DOCX only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are supported'));
    }
  },
});

const router = express.Router();

// All AI routes are protected
router.use(authMiddleware);

// ─── Helper: serialize resume for AI context ─────────────────
function resumeToText(resume) {
  const parts = [];

  if (resume.personal?.name) {
    parts.push(`NAME: ${resume.personal.name}`);
    const contact = [resume.personal.email, resume.personal.phone, resume.personal.location]
      .filter(Boolean).join(' | ');
    if (contact) parts.push(`CONTACT: ${contact}`);
    const links = [resume.personal.linkedin, resume.personal.github, resume.personal.website]
      .filter(Boolean).join(' | ');
    if (links) parts.push(`LINKS: ${links}`);
  }

  if (resume.summary) {
    parts.push(`\nSUMMARY:\n${resume.summary}`);
  }

  if (resume.experience?.length) {
    parts.push('\nEXPERIENCE:');
    resume.experience.forEach((exp) => {
      const dateRange = [exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' – ');
      parts.push(`${exp.title} at ${exp.company} (${exp.location || ''}) [${dateRange}]`);
      if (exp.bullets?.length) {
        exp.bullets.filter(Boolean).forEach((b) => parts.push(`  • ${b}`));
      }
    });
  }

  if (resume.education?.length) {
    parts.push('\nEDUCATION:');
    resume.education.forEach((edu) => {
      parts.push(`${edu.degree} — ${edu.school} (${edu.location || ''}) ${edu.year || ''} ${edu.gpa ? 'GPA: ' + edu.gpa : ''}`);
    });
  }

  if (resume.projects?.length) {
    parts.push('\nPROJECTS:');
    resume.projects.forEach((proj) => {
      parts.push(`${proj.name}${proj.technologies ? ` [${proj.technologies}]` : ''}`);
      if (proj.description) parts.push(`  ${proj.description}`);
      if (proj.link) parts.push(`  Link: ${proj.link}`);
      if (proj.bullets?.length) {
        proj.bullets.filter(Boolean).forEach((b) => parts.push(`  • ${b}`));
      }
    });
  }

  if (resume.skills?.length) {
    parts.push(`\nSKILLS: ${resume.skills.join(', ')}`);
  }

  if (resume.certifications?.filter(Boolean).length) {
    parts.push(`\nCERTIFICATIONS: ${resume.certifications.filter(Boolean).join(', ')}`);
  }

  return parts.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// POST /api/ai/score — ATS score + category breakdown
// ═══════════════════════════════════════════════════════════════
router.post('/score', async (req, res) => {
  try {
    const { resumeId } = req.body;
    if (!resumeId) return res.status(400).json({ error: 'resumeId is required' });

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    if (!resume.targetJD) return res.status(400).json({ error: 'No job description set — paste a JD in the Analyze tab first' });

    const text = resumeToText(resume);
    const priorityKeywords = resume.parsedJD?.mustHaveSkills || [];
    const result = await gemini.scoreATS(text, resume.targetJD, priorityKeywords);

    // Update resume in DB with scores
    await Resume.findByIdAndUpdate(resumeId, {
      atsScore: result.totalScore,
      atsBreakdown: {
        keywords: result.breakdown.keywords?.score,
        actionVerbs: result.breakdown.actionVerbs?.score,
        quantification: result.breakdown.quantification?.score,
        formatting: result.breakdown.formatting?.score,
        sections: result.breakdown.sections?.score,
        contactInfo: result.breakdown.contactInfo?.score,
        summaryRelevance: result.breakdown.summaryRelevance?.score,
        readability: result.breakdown.readability?.score,
      },
      lastAnalyzed: new Date(),
    });

    res.json(result);
  } catch (err) {
    console.error('AI Score error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate ATS score' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/ai/keywords — Keyword gap analysis vs JD
// ═══════════════════════════════════════════════════════════════
router.post('/keywords', async (req, res) => {
  try {
    const { resumeId } = req.body;
    if (!resumeId) return res.status(400).json({ error: 'resumeId is required' });

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    if (!resume.targetJD) return res.status(400).json({ error: 'No job description set' });

    const text = resumeToText(resume);
    const result = await gemini.getKeywordGap(text, resume.targetJD);
    res.json(result);
  } catch (err) {
    console.error('AI Keywords error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to analyze keywords' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/ai/rewrite — Rewrite a single bullet point
// ═══════════════════════════════════════════════════════════════
router.post('/rewrite', async (req, res) => {
  try {
    const { bullet, jobDescription, role } = req.body;
    if (!bullet) return res.status(400).json({ error: 'bullet is required' });

    const result = await gemini.rewriteBullet(bullet, jobDescription, role);
    res.json(result);
  } catch (err) {
    console.error('AI Rewrite error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to rewrite bullet' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/ai/summary — Generate professional summary
// ═══════════════════════════════════════════════════════════════
router.post('/summary', async (req, res) => {
  try {
    const { resumeId } = req.body;
    if (!resumeId) return res.status(400).json({ error: 'resumeId is required' });

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    if (!resume.targetJD) return res.status(400).json({ error: 'No job description set — paste a JD in the Analyze tab first' });

    const text = resumeToText(resume);
    const priorityKeywords = resume.parsedJD?.mustHaveSkills || [];
    const result = await gemini.generateSummary(text, resume.targetJD, priorityKeywords);

    // Update summary in DB
    if (result.summary) {
      await Resume.findByIdAndUpdate(resumeId, { summary: result.summary });
    }

    res.json(result);
  } catch (err) {
    console.error('AI Summary error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate summary' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/ai/improve — Full resume improvement (paste flow)
// ═══════════════════════════════════════════════════════════════
router.post('/improve', async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText) return res.status(400).json({ error: 'resumeText is required' });
    if (!jobDescription) return res.status(400).json({ error: 'jobDescription is required' });

    const result = await gemini.improveResume(resumeText, jobDescription);
    res.json(result);
  } catch (err) {
    console.error('AI Improve error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to improve resume' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/ai/parse-resume — Upload PDF/DOCX → parse → return JSON
// Used by Builder auto-populate (no DB save)
// ═══════════════════════════════════════════════════════════════
router.post('/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please select a PDF or DOCX file.' });
    }

    // 1. Extract raw text from file
    const { text: rawText, sourceFormat } = await extractText(req.file.buffer, req.file.mimetype);

    if (!rawText || rawText.length < 50) {
      return res.status(400).json({ error: 'Could not extract enough text from the file. Please ensure it is a valid resume.' });
    }

    // 2. Use Gemini to parse raw text into structured resume JSON
    // Allow client to force LinkedIn format via form field hint
    const format = req.body.hint === 'linkedin' ? 'linkedin' : sourceFormat;
    const parsed = await gemini.parseResume(rawText, format);

    res.json(parsed);
  } catch (err) {
    console.error('AI Parse Resume error:', err.message);
    if (err.message?.includes('Only PDF and DOCX')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Failed to parse resume' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/ai/score-upload — Upload PDF/DOCX + optional JD → ATS score
// Standalone ATS checker (no saved resume required)
// ═══════════════════════════════════════════════════════════════
router.post('/score-upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please select a PDF or DOCX file.' });
    }

    // 1. Extract raw text from file
    const { text: rawText } = await extractText(req.file.buffer, req.file.mimetype);

    if (!rawText || rawText.length < 50) {
      return res.status(400).json({ error: 'Could not extract enough text from the file. Please ensure it is a valid resume.' });
    }

    const jobDescription = req.body.jobDescription?.trim() || null;

    // 2. Score using Gemini
    const result = await gemini.scoreUpload(rawText, jobDescription);

    // Add metadata to response
    result.mode = jobDescription ? 'targeted' : 'general';

    res.json(result);
  } catch (err) {
    console.error('AI Score Upload error:', err.message);
    if (err.message?.includes('Only PDF and DOCX')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Failed to score resume' });
  }
});

module.exports = router;
