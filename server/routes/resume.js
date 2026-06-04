const express = require('express');
const multer = require('multer');
const Resume = require('../models/Resume');
const authMiddleware = require('../middleware/auth');
const { extractText } = require('../services/fileParser');
const gemini = require('../services/gemini');

const router = express.Router();

// Multer config — store in memory, max 10MB, PDF/DOCX only
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

// All routes are protected
router.use(authMiddleware);

// ═══════════════════════════════════════════════════════════════
// POST /api/resume/upload — Upload PDF/DOCX → parse → create resume
// ═══════════════════════════════════════════════════════════════
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please select a PDF or DOCX file.' });
    }

    // 1. Extract raw text from file
    const rawText = await extractText(req.file.buffer, req.file.mimetype);

    if (!rawText || rawText.length < 50) {
      return res.status(400).json({ error: 'Could not extract enough text from the file. Please ensure it is a valid resume.' });
    }

    // 2. Use Gemini to parse raw text into structured resume JSON
    const parsed = await gemini.parseResume(rawText);

    // 3. Create resume in DB with parsed data
    const resume = await Resume.create({
      ...parsed,
      title: parsed.title || 'Uploaded Resume',
      template: 'modern',
      userId: req.user.id,
    });

    res.status(201).json(resume);
  } catch (err) {
    console.error('Resume upload error:', err.message);
    if (err.message?.includes('Only PDF and DOCX')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Failed to parse resume' });
  }
});

// GET /api/resume — Get all resumes for current user
router.get('/', async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id })
      .select('title template atsScore updatedAt createdAt')
      .sort({ updatedAt: -1 });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// GET /api/resume/:id — Get single resume
router.get('/:id', async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

// POST /api/resume — Create new resume
router.post('/', async (req, res) => {
  try {
    const resume = await Resume.create({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(resume);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create resume' });
  }
});

// PUT /api/resume/:id — Update resume
router.put('/:id', async (req, res) => {
  try {
    // Prevent userId from being changed
    const { userId, ...updateData } = req.body;

    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update resume' });
  }
});

// DELETE /api/resume/:id — Delete resume
router.delete('/:id', async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json({ message: 'Resume deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

// POST /api/resume/:id/duplicate — Duplicate a resume
router.post('/:id/duplicate', async (req, res) => {
  try {
    const original = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!original) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const duplicateData = original.toObject();
    delete duplicateData._id;
    delete duplicateData.__v;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    duplicateData.title = (duplicateData.title || 'Untitled Resume') + ' (Copy)';

    const duplicate = await Resume.create(duplicateData);
    res.status(201).json(duplicate);
  } catch (err) {
    res.status(500).json({ error: 'Failed to duplicate resume' });
  }
});

module.exports = router;
