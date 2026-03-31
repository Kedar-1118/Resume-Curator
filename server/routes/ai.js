const express = require('express');
const authMiddleware = require('../middleware/auth');
const Resume = require('../models/Resume');
const { callClaude } = require('../services/claude');

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

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyzer. Score the resume against the job description across 8 criteria. Each score is 0-100. Be specific in feedback — mention exact missing keywords, weak bullets by number, and concrete improvements. Return ONLY a valid JSON object, no markdown, no explanation, matching this exact schema:
{
  "totalScore": number,
  "breakdown": {
    "keywords": { "score": number, "feedback": "string" },
    "actionVerbs": { "score": number, "feedback": "string" },
    "quantification": { "score": number, "feedback": "string" },
    "formatting": { "score": number, "feedback": "string" },
    "sections": { "score": number, "feedback": "string" },
    "contactInfo": { "score": number, "feedback": "string" },
    "summaryRelevance": { "score": number, "feedback": "string" },
    "readability": { "score": number, "feedback": "string" }
  },
  "topSuggestions": ["string"]
}`;

    const userContent = `RESUME:\n${resumeToText(resume)}\n\nJOB DESCRIPTION:\n${resume.targetJD}`;

    const result = await callClaude(systemPrompt, userContent);

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

    const systemPrompt = `You are an expert ATS keyword analyzer. Extract all important keywords, technical skills, and phrases from the job description. Compare them against the resume. Be thorough — check skills section, experience bullets, and summary. Return ONLY valid JSON, no markdown, no explanation:
{
  "matched": ["keyword1", "keyword2"],
  "missing": ["keyword3", "keyword4"],
  "suggested": ["Actionable suggestion 1", "Actionable suggestion 2"]
}`;

    const userContent = `RESUME:\n${resumeToText(resume)}\n\nJOB DESCRIPTION:\n${resume.targetJD}`;

    const result = await callClaude(systemPrompt, userContent);
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

    const systemPrompt = `You are an expert resume writer specializing in ATS-optimized content. Rewrite this bullet point to be:
1. Action-verb-first (use a strong past-tense verb like Led, Built, Designed, Implemented, Reduced, etc.)
2. Quantified with metrics (add realistic numbers: %, $, time saved, team size, etc.)
3. Naturally embedded with relevant keywords from the job description
4. One clear, impactful sentence (not a run-on)
Keep it under 25 words if possible. Do NOT use "I".
Return ONLY valid JSON, no markdown, no explanation:
{
  "original": "the original bullet",
  "rewritten": "the improved bullet",
  "improvements": ["What changed and why (1)", "What changed and why (2)"]
}`;

    const userContent = `BULLET TO REWRITE: "${bullet}"${
      jobDescription ? `\n\nJOB DESCRIPTION:\n${jobDescription}` : ''
    }${role ? `\n\nROLE/TITLE: ${role}` : ''}`;

    const result = await callClaude(systemPrompt, userContent);
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

    const systemPrompt = `You are an expert resume writer. Write a professional resume summary that is:
- 3-4 lines, approximately 50-70 words
- Tailored specifically to the job description
- Uses keywords from the JD naturally (not stuffed)
- Starts with a strong descriptor (e.g., "Results-driven", "Detail-oriented", "Innovative")
- Mentions years of experience, key skills, and value proposition
- Does NOT use "I" or first-person pronouns
- Written in present tense
Return ONLY valid JSON, no markdown, no explanation:
{
  "summary": "The generated summary text"
}`;

    const userContent = `RESUME:\n${resumeToText(resume)}\n\nJOB DESCRIPTION:\n${resume.targetJD}`;

    const result = await callClaude(systemPrompt, userContent);

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

    const systemPrompt = `You are an expert ATS resume optimizer. Parse this raw resume text and improve it for the given job description. Optimize for ATS compatibility:
- Use strong action verbs
- Add quantified results where reasonable
- Embed job description keywords naturally
- Ensure proper section structure

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "title": "string",
  "personal": {
    "name": "string", "email": "string", "phone": "string",
    "location": "string", "linkedin": "string", "github": "string", "website": "string"
  },
  "summary": "string",
  "experience": [{
    "title": "string", "company": "string", "location": "string",
    "startDate": "string", "endDate": "string", "current": false,
    "bullets": ["string"]
  }],
  "education": [{
    "degree": "string", "school": "string", "location": "string",
    "year": "string", "gpa": "string"
  }],
  "skills": ["string"],
  "certifications": ["string"]
}`;

    const userContent = `RAW RESUME TEXT:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`;

    const result = await callClaude(systemPrompt, userContent);
    res.json(result);
  } catch (err) {
    console.error('AI Improve error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to improve resume' });
  }
});

module.exports = router;
