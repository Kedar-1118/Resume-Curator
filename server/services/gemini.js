const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Call Gemini API with a system prompt and user content.
 * Returns parsed JSON response.
 * Drop-in replacement for callClaude — same interface.
 *
 * @param {string} systemPrompt - The system-level instruction
 * @param {string} userContent  - The user message content
 * @returns {object} Parsed JSON response from Gemini
 */
async function callGemini(systemPrompt, userContent) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userContent);
    const text = result.response.text();

    // Strip markdown code fences if present
    const cleanText = text.replace(/```json\n?|```\n?/g, '').trim();

    return JSON.parse(cleanText);
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(`Gemini returned invalid JSON: ${err.message}`);
    }
    if (err.message?.includes('API_KEY_INVALID') || err.status === 401) {
      throw new Error('Invalid Gemini API key — check GEMINI_API_KEY in .env');
    }
    if (err.status === 429 || err.message?.includes('RATE_LIMIT')) {
      throw new Error('Gemini API rate limit exceeded — try again in a moment');
    }
    throw new Error(`Gemini API error: ${err.message}`);
  }
}

module.exports = { callGemini };
