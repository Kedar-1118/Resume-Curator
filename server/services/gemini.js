const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Custom Error ────────────────────────────────────────────
class GeminiError extends Error {
  constructor(code, message, retries = 0) {
    super(message);
    this.name = 'GeminiError';
    this.code = code;
    this.retries = retries;
  }
}

// ─── GeminiService ───────────────────────────────────────────
class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.modelName = 'gemini-2.5-flash';
  }

  /**
   * Central method for all Gemini API calls.
   * Handles retry (max 3, exponential backoff), logging, JSON parsing.
   *
   * @param {string} systemPrompt - System-level instruction
   * @param {string} userPrompt   - User message content
   * @param {object} options      - { method: string (for logging), maxRetries: number }
   * @returns {object} Parsed JSON response
   */
  async _call(systemPrompt, userPrompt, options = {}) {
    const { method = 'unknown', maxRetries = 3 } = options;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const start = Date.now();
      try {
        const model = this.genAI.getGenerativeModel({
          model: this.modelName,
          systemInstruction: systemPrompt,
        });

        const result = await model.generateContent(userPrompt);
        const text = result.response.text();
        const latencyMs = Date.now() - start;

        // Estimate token counts from text lengths (rough approximation)
        const inputTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
        const outputTokens = Math.ceil(text.length / 4);

        console.log(
          `[Gemini] ${method} | attempt=${attempt} | input≈${inputTokens}tok | output≈${outputTokens}tok | ${latencyMs}ms`
        );

        // Strip markdown code fences before parsing
        const cleanText = text.replace(/```json\n?|```\n?/g, '').trim();
        return JSON.parse(cleanText);
      } catch (err) {
        const latencyMs = Date.now() - start;
        lastError = err;

        // Don't retry on auth errors or JSON parse errors
        if (err instanceof SyntaxError) {
          console.error(`[Gemini] ${method} | JSON parse failed after ${latencyMs}ms (attempt ${attempt})`);
          throw new GeminiError('INVALID_JSON', `Gemini returned invalid JSON: ${err.message}`, attempt);
        }
        if (err.message?.includes('API_KEY_INVALID') || err.status === 401) {
          throw new GeminiError('AUTH_ERROR', 'Invalid Gemini API key — check GEMINI_API_KEY in .env', attempt);
        }

        // Retry on rate limits and transient errors
        const isRetryable =
          err.status === 429 ||
          err.status === 503 ||
          err.message?.includes('RATE_LIMIT') ||
          err.message?.includes('UNAVAILABLE') ||
          err.message?.includes('INTERNAL');

        if (isRetryable && attempt < maxRetries) {
          const backoff = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
          console.warn(
            `[Gemini] ${method} | retryable error (attempt ${attempt}/${maxRetries}), waiting ${backoff}ms: ${err.message}`
          );
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        console.error(`[Gemini] ${method} | failed after ${attempt} attempt(s) in ${latencyMs}ms: ${err.message}`);
      }
    }

    // All retries exhausted
    if (lastError?.status === 429 || lastError?.message?.includes('RATE_LIMIT')) {
      throw new GeminiError('RATE_LIMITED', 'Gemini API rate limit exceeded — try again in a moment', maxRetries);
    }
    throw new GeminiError('API_ERROR', `Gemini API error: ${lastError?.message}`, maxRetries);
  }

  // ═══════════════════════════════════════════════════════════
  // Named methods — each encapsulates the prompt for one use-case
  // ═══════════════════════════════════════════════════════════

  /**
   * ATS score analysis against a job description.
   * @param {string} resumeText - Serialized resume text
   * @param {string} jdText     - Job description text
   * @param {string[]} priorityKeywords - Must-have skills to emphasize
   */
  async scoreATS(resumeText, jdText, priorityKeywords = []) {
    const priorityNote =
      priorityKeywords.length > 0
        ? `\nPay special attention to these must-have skills from the JD: ${priorityKeywords.join(', ')}`
        : '';

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyzer. Score the resume against the job description across 8 criteria. Each score is 0-100. Be specific in feedback — mention exact missing keywords, weak bullets by number, and concrete improvements.${priorityNote} Return ONLY a valid JSON object, no markdown, no explanation, matching this exact schema:
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

    const userContent = `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jdText}`;
    return this._call(systemPrompt, userContent, { method: 'scoreATS' });
  }

  /**
   * Keyword gap analysis — resume vs JD.
   */
  async getKeywordGap(resumeText, jdText) {
    const systemPrompt = `You are an expert ATS keyword analyzer. Extract all important keywords, technical skills, and phrases from the job description. Compare them against the resume. Be thorough — check skills section, experience bullets, and summary. Categorize missing keywords into must-have (required/essential in the JD) and nice-to-have (preferred/bonus). Return ONLY valid JSON, no markdown, no explanation:
{
  "matched": ["keyword1", "keyword2"],
  "missingMustHave": ["keyword3"],
  "missingNiceToHave": ["keyword4"],
  "suggested": ["Actionable suggestion 1", "Actionable suggestion 2"]
}`;

    const userContent = `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jdText}`;
    return this._call(systemPrompt, userContent, { method: 'getKeywordGap' });
  }

  /**
   * Rewrite a single bullet point for ATS optimization.
   */
  async rewriteBullet(bullet, jdText, role, priorityKeywords = []) {
    const keywordNote =
      priorityKeywords.length > 0
        ? `\nPrioritize embedding these must-have keywords if relevant: ${priorityKeywords.join(', ')}`
        : '';

    const systemPrompt = `You are an expert resume writer specializing in ATS-optimized content. Rewrite this bullet point to be:
1. Action-verb-first (use a strong past-tense verb like Led, Built, Designed, Implemented, Reduced, etc.)
2. Quantified with metrics (add realistic numbers: %, $, time saved, team size, etc.)
3. Naturally embedded with relevant keywords from the job description
4. One clear, impactful sentence (not a run-on)
Keep it under 25 words if possible. Do NOT use "I".${keywordNote}
Return ONLY valid JSON, no markdown, no explanation:
{
  "original": "the original bullet",
  "rewritten": "the improved bullet",
  "improvements": ["What changed and why (1)", "What changed and why (2)"]
}`;

    const userContent = `BULLET TO REWRITE: "${bullet}"${
      jdText ? `\n\nJOB DESCRIPTION:\n${jdText}` : ''
    }${role ? `\n\nROLE/TITLE: ${role}` : ''}`;

    return this._call(systemPrompt, userContent, { method: 'rewriteBullet' });
  }

  /**
   * Generate a professional summary from resume + JD context.
   */
  async generateSummary(resumeText, jdText, priorityKeywords = []) {
    const keywordNote =
      priorityKeywords.length > 0
        ? `\nMake sure to naturally embed these must-have keywords: ${priorityKeywords.join(', ')}`
        : '';

    const systemPrompt = `You are an expert resume writer. Write a professional resume summary that is:
- 3-4 lines, approximately 50-70 words
- Tailored specifically to the job description
- Uses keywords from the JD naturally (not stuffed)
- Starts with a strong descriptor (e.g., "Results-driven", "Detail-oriented", "Innovative")
- Mentions years of experience, key skills, and value proposition
- Does NOT use "I" or first-person pronouns
- Written in present tense${keywordNote}
Return ONLY valid JSON, no markdown, no explanation:
{
  "summary": "The generated summary text"
}`;

    const userContent = `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jdText}`;
    return this._call(systemPrompt, userContent, { method: 'generateSummary' });
  }

  /**
   * Parse raw resume text (from uploaded file) into structured JSON.
   * @param {string} text - Extracted plain text from PDF/DOCX
   * @param {string} sourceFormat - 'generic' or 'linkedin'
   */
  async parseResume(text, sourceFormat = 'generic') {
    let sourceNote = '';
    if (sourceFormat === 'linkedin') {
      sourceNote = `This is a LinkedIn profile export PDF. LinkedIn PDFs use section headers like 'Experience', 'Education', 'Licenses & Certifications', 'Skills', 'Recommendations'. Map 'Licenses & Certifications' to the certifications array. Ignore the 'Recommendations' section entirely. Map connection count and follower count fields to nothing. Parse all else normally.\n`;
    }

    const systemPrompt = `${sourceNote}You are an expert resume parser. Extract all information from this raw resume text into a structured JSON format. Be thorough — extract every detail including all bullet points, dates, and contact information. If a field is not found, use an empty string or empty array. Return ONLY valid JSON, no markdown, no explanation:
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

    return this._call(systemPrompt, `RAW RESUME TEXT:\n${text}`, { method: 'parseResume' });
  }

  /**
   * Parse a job description into structured metadata.
   */
  async parseJD(jdText) {
    const systemPrompt = `You extract structured metadata from job descriptions. Output ONLY valid JSON, no markdown.`;

    const userPrompt = `Extract from this JD:\n${jdText}\n\nOutput:
{
  "company": "string",
  "roleTitle": "string",
  "level": "senior|junior|mid|lead|intern|executive|",
  "industry": "string",
  "mustHaveSkills": ["skill1"],
  "niceToHaveSkills": ["skill2"]
}
mustHaveSkills = skills marked as required/must/essential. niceToHaveSkills = preferred/bonus/nice-to-have. If not explicit, infer from emphasis.`;

    return this._call(systemPrompt, userPrompt, { method: 'parseJD' });
  }

  /**
   * Generate resume project entries from GitHub RAG context + JD.
   */
  async generateProjects(chunks, resumeContext, jd, count = 3) {
    const systemPrompt = `You are an expert resume writer. Given retrieved GitHub repository context and a target job description, generate structured resume project entries. Output ONLY a valid JSON array, no markdown, no explanation.`;

    const userPrompt = `Target Job Description:\n${jd}\n\nCandidate Background:\n${resumeContext}\n\nRetrieved Repository Context:\n${chunks.map((c) => c.text).join('\n---\n')}\n\nGenerate ${count} resume project entries. For each, output:
{
  "name": "Project display name",
  "description": "One sentence impact-focused description",
  "techStack": ["Tech1", "Tech2"],
  "highlights": [
    "Action verb + what you built + measurable outcome",
    "Another bullet showing technical depth or scale"
  ],
  "githubUrl": "https://github.com/...",
  "startDate": "MMM YYYY or empty string",
  "endDate": "MMM YYYY or Present or empty string"
}
Prioritise repos most relevant to the job description. Use strong action verbs. Quantify impact where the README provides numbers.`;

    return this._call(systemPrompt, userPrompt, { method: 'generateProjects' });
  }

  /**
   * Generate a structured cover letter from resume + parsed JD.
   */
  async generateCoverLetter(resumeJSON, parsedJD) {
    const systemPrompt = `You are an expert cover letter writer. Output ONLY valid JSON, no markdown, no explanation.`;

    const mustHaves = parsedJD?.mustHaveSkills?.join(', ') || 'N/A';
    const userPrompt = `Resume data: ${JSON.stringify(resumeJSON)}\nJob: ${parsedJD?.roleTitle || 'Unknown Role'} at ${parsedJD?.company || 'Unknown Company'}\nMust-have skills: ${mustHaves}\n\nGenerate a professional cover letter as JSON:
{
  "salutation": "Dear Hiring Manager,",
  "opening": "One strong hook paragraph (3-4 sentences)",
  "bodyParagraphs": [
    "Para 1: Relevant experience matching must-have skills",
    "Para 2: Key project or achievement with quantified impact",
    "Para 3: Why this company / role specifically"
  ],
  "closing": "Closing paragraph + sign-off sentence",
  "subject": "Application for {role} — {candidateName}"
}`;

    return this._call(systemPrompt, userPrompt, { method: 'generateCoverLetter' });
  }

  /**
   * Full resume improvement from raw pasted text + JD.
   */
  async improveResume(rawText, jdText) {
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

    const userContent = `RAW RESUME TEXT:\n${rawText}\n\nJOB DESCRIPTION:\n${jdText}`;
    return this._call(systemPrompt, userContent, { method: 'improveResume' });
  }

  /**
   * ATS score for an uploaded file (general or targeted).
   * @param {string} resumeText - Extracted text from uploaded file
   * @param {string|null} jdText - Optional job description text
   */
  async scoreUpload(resumeText, jdText = null) {
    const isTargeted = !!jdText;

    let systemPrompt;
    let userContent;

    if (isTargeted) {
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
      userContent = `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jdText}`;
    } else {
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
      userContent = `RESUME:\n${resumeText}`;
    }

    return this._call(systemPrompt, userContent, { method: 'scoreUpload' });
  }
}

// Export singleton instance
module.exports = new GeminiService();
