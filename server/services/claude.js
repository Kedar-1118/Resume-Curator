const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Call Claude API with a system prompt and user content.
 * Returns parsed JSON response.
 *
 * @param {string} systemPrompt - The system-level instruction
 * @param {string} userContent  - The user message content
 * @returns {object} Parsed JSON response from Claude
 */
async function callClaude(systemPrompt, userContent) {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    const text = message.content[0].text;

    // Strip markdown code fences if present
    const cleanText = text.replace(/```json\n?|```\n?/g, '').trim();

    return JSON.parse(cleanText);
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(`Claude returned invalid JSON: ${err.message}`);
    }
    if (err.status === 401) {
      throw new Error('Invalid Anthropic API key');
    }
    if (err.status === 429) {
      throw new Error('Claude API rate limit exceeded — try again in a moment');
    }
    throw new Error(`Claude API error: ${err.message}`);
  }
}

module.exports = { callClaude };
