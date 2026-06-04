const express = require('express');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Resume = require('../models/Resume');
const { ingestUserRepos, queryRelevantChunks } = require('../services/githubRAG');
const gemini = require('../services/gemini');

const router = express.Router();

// All GitHub routes are protected
router.use(authMiddleware);

// ═══════════════════════════════════════════════════════════════
// POST /api/github/ingest — Trigger repo ingestion
// ═══════════════════════════════════════════════════════════════
router.post('/ingest', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.githubAccessToken) {
      return res.status(400).json({ error: 'GitHub not connected. Connect your GitHub account first.' });
    }

    if (user.githubIngestionStatus === 'running') {
      return res.json({ status: 'running', message: 'Ingestion already in progress' });
    }

    // Mark as running
    await User.findByIdAndUpdate(req.user.id, { githubIngestionStatus: 'running' });

    // Respond immediately
    res.json({ status: 'ingesting', message: 'Repo ingestion started in the background' });

    // Run ingestion in background
    ingestUserRepos(req.user.id, user.githubAccessToken)
      .then(async (result) => {
        await User.findByIdAndUpdate(req.user.id, { githubIngestionStatus: 'done' });
        console.log(`[GitHub] Ingestion complete for user ${req.user.id}:`, result);
      })
      .catch(async (err) => {
        await User.findByIdAndUpdate(req.user.id, { githubIngestionStatus: 'error' });
        console.error(`[GitHub] Ingestion failed for user ${req.user.id}:`, err.message);
      });
  } catch (err) {
    console.error('GitHub ingest error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to start ingestion' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/github/ingest/status — Check ingestion status
// ═══════════════════════════════════════════════════════════════
router.get('/ingest/status', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      'githubIngestionStatus githubConnectedAt githubUsername githubId'
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      connected: !!user.githubId,
      username: user.githubUsername || null,
      ingestionStatus: user.githubIngestionStatus || 'idle',
      connectedAt: user.githubConnectedAt || null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/github/generate-projects — RAG-based project generation
// ═══════════════════════════════════════════════════════════════
router.post('/generate-projects', async (req, res) => {
  try {
    const { resumeId, count = 3 } = req.body;
    if (!resumeId) return res.status(400).json({ error: 'resumeId is required' });

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    if (!resume.targetJD) {
      return res.status(400).json({ error: 'No job description set — paste a JD first' });
    }

    const user = await User.findById(req.user.id);
    if (!user?.githubAccessToken) {
      return res.status(400).json({ error: 'GitHub not connected' });
    }

    // Build query from JD + resume context
    const query = `${resume.targetJD}\n${resume.summary || ''}`;
    const chunks = await queryRelevantChunks(req.user.id, query, 8);

    if (!chunks.length) {
      return res.status(400).json({
        error: 'No repo data found. Please sync your GitHub repos first.',
      });
    }

    // Build resume context for the prompt
    const resumeContext = `${resume.summary || ''} | Skills: ${(resume.skills || []).join(', ')}`;

    // Generate projects using Gemini
    const projects = await gemini.generateProjects(chunks, resumeContext, resume.targetJD, Math.min(count, 5));

    res.json(projects);
  } catch (err) {
    console.error('GitHub generate projects error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate projects' });
  }
});

module.exports = router;
