const express = require('express');
const authMiddleware = require('../middleware/auth');
const Resume = require('../models/Resume');
const { generatePDF } = require('../services/pdfExport');
const { generateDOCX } = require('../services/docxExport');

const router = express.Router();

// All export routes are protected
router.use(authMiddleware);

// ═══════════════════════════════════════════════════════════════
// POST /api/export/pdf — Puppeteer PDF export
// ═══════════════════════════════════════════════════════════════
router.post('/pdf', async (req, res) => {
  try {
    const { resumeId, template } = req.body;
    if (!resumeId) return res.status(400).json({ error: 'resumeId is required' });

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const pdfBuffer = await generatePDF(resume.toObject(), template || resume.template || 'modern');

    const filename = `${(resume.title || 'resume').replace(/[^a-zA-Z0-9\s-]/g, '').trim()}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF export error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate PDF' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/export/docx — DOCX file export
// ═══════════════════════════════════════════════════════════════
router.post('/docx', async (req, res) => {
  try {
    const { resumeId } = req.body;
    if (!resumeId) return res.status(400).json({ error: 'resumeId is required' });

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const docxBuffer = await generateDOCX(resume.toObject());

    const filename = `${(resume.title || 'resume').replace(/[^a-zA-Z0-9\s-]/g, '').trim()}.docx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': docxBuffer.length,
    });

    res.send(docxBuffer);
  } catch (err) {
    console.error('DOCX export error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate DOCX' });
  }
});

module.exports = router;
