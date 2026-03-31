const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const Resume = require('../models/Resume');
// const { callClaude } = require('../services/claude'); // kept for future use
const { callGemini } = require('../services/gemini');
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

    const result = await callGemini(systemPrompt, userContent);

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

    const result = await callGemini(systemPrompt, userContent);
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

    const result = await callGemini(systemPrompt, userContent);
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

    const result = await callGemini(systemPrompt, userContent);

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
  "projects": [{
    "name": "string", "description": "string", "technologies": "string",
    "link": "string", "bullets": ["string"]
  }],
  "skills": ["string"],
  "certifications": ["string"]
}`;

    const userContent = `RAW RESUME TEXT:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`;

    const result = await callGemini(systemPrompt, userContent);
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
    const rawText = await extractText(req.file.buffer, req.file.mimetype);

    if (!rawText || rawText.length < 50) {
      return res.status(400).json({ error: 'Could not extract enough text from the file. Please ensure it is a valid resume.' });
    }

    // 2. Use Gemini to parse raw text into structured resume JSON
    const systemPrompt = `You are an expert resume parser. Extract all information from this raw resume text into a structured JSON format. Be thorough — extract every detail including all bullet points, dates, and contact information. If a field is not found, use an empty string or empty array. Return ONLY valid JSON, no markdown, no explanation:
{
  "title": "string (create a short title like 'Software Engineer Resume')",
  "personal": {
    "name": "string", "email": "string", "phone": "string",
    "location": "string", "linkedin": "string", "github": "string", "website": "string"
  },
  "summary": "string (the professional summary/objective if present)",
  "experience": [{
    "title": "string", "company": "string", "location": "string",
    "startDate": "string", "endDate": "string", "current": false,
    "bullets": ["string"]
  }],
  "education": [{
    "degree": "string", "school": "string", "location": "string",
    "year": "string", "gpa": "string"
  }],
  "projects": [{
    "name": "string", "description": "string", "technologies": "string",
    "link": "string", "bullets": ["string"]
  }],
  "skills": ["string"],
  "certifications": ["string"]
}`;

    const parsed = await callGemini(systemPrompt, `RAW RESUME TEXT:\n${rawText}`);

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
    const rawText = await extractText(req.file.buffer, req.file.mimetype);

    if (!rawText || rawText.length < 50) {
      return res.status(400).json({ error: 'Could not extract enough text from the file. Please ensure it is a valid resume.' });
    }

    const jobDescription = req.body.jobDescription?.trim();
    const isTargeted = !!jobDescription;

    // 2. Build the appropriate prompt based on whether JD is provided
    let systemPrompt;
    let userContent;

    if (isTargeted) {
      // ── Targeted scoring: resume vs specific JD ──
      systemPrompt = `You are an expert ATS (Applicant Tracking System) analyzer. Score the resume against the job description across 8 criteria. Each score is 0-100. Be specific in feedback — mention exact missing keywords, weak bullets by number, and concrete improvements. Return ONLY a valid JSON object, no markdown, no explanation, matching this exact schema:
{
  "totalScore": number,
  "mode": "targeted",
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
      userContent = `RESUME:\n${rawText}\n\nJOB DESCRIPTION:\n${jobDescription}`;
    } else {
      // ── General scoring: ATS best practices only ──
      systemPrompt = `You are an expert ATS (Applicant Tracking System) analyzer. Score this resume on general ATS best practices — no specific job description is provided. Evaluate across 8 criteria based on universal ATS compatibility standards. Each score is 0-100. Be specific in feedback — mention concrete issues and improvements. Return ONLY a valid JSON object, no markdown, no explanation, matching this exact schema:
{
  "totalScore": number,
  "mode": "general",
  "breakdown": {
    "keywords": { "score": number, "feedback": "Evaluate if resume uses strong industry-relevant keywords" },
    "actionVerbs": { "score": number, "feedback": "Check if bullets start with strong action verbs" },
    "quantification": { "score": number, "feedback": "Check if achievements are quantified with numbers/metrics" },
    "formatting": { "score": number, "feedback": "Evaluate ATS-safe formatting: single column, no tables, no images" },
    "sections": { "score": number, "feedback": "Check for standard section headings: Summary, Experience, Education, Skills" },
    "contactInfo": { "score": number, "feedback": "Check completeness: name, email, phone, location, LinkedIn" },
    "summaryRelevance": { "score": number, "feedback": "Evaluate if professional summary is compelling and well-written" },
    "readability": { "score": number, "feedback": "Check overall length, clarity, and conciseness" }
  },
  "topSuggestions": ["string"]
}`;
      userContent = `RESUME:\n${rawText}`;
    }

    const result = await callGemini(systemPrompt, userContent);

    // Add metadata to response
    result.mode = isTargeted ? 'targeted' : 'general';

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
