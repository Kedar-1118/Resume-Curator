/**
 * Embedding service for text chunks using Gemini's text-embedding-004 model.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const RepoChunk = require('../models/RepoChunk');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Embed a single text string for document storage.
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} 768-dimension embedding vector
 */
async function embedText(text, taskType = 'RETRIEVAL_DOCUMENT') {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent({
    content: { parts: [{ text }] },
    taskType,
  });
  return result.embedding.values;
}

/**
 * Embed an array of chunks and store them in MongoDB.
 * @param {string} userId - User's MongoDB ObjectId
 * @param {Array} chunks - Array of chunk objects from repoChunker
 * @returns {Promise<number>} Number of chunks stored
 */
async function embedChunks(userId, chunks) {
  let stored = 0;

  // Process in batches of 5 to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    const embeddings = await Promise.all(
      batch.map(async (chunk) => {
        try {
          const embedding = await embedText(chunk.text);
          return { chunk, embedding };
        } catch (err) {
          console.error(`[Embedder] Failed to embed chunk for ${chunk.repoName}:`, err.message);
          return null;
        }
      })
    );

    // Store successful embeddings
    for (const item of embeddings.filter(Boolean)) {
      try {
        await RepoChunk.create({
          userId,
          repoId: item.chunk.repoId,
          repoName: item.chunk.repoName,
          repoUrl: item.chunk.repoUrl,
          pushedAt: item.chunk.pushedAt,
          chunkType: item.chunk.chunkType,
          text: item.chunk.text,
          embedding: item.embedding,
          commitActivity: item.chunk.commitActivity || [],
        });
        stored++;
      } catch (err) {
        console.error(`[Embedder] Failed to store chunk:`, err.message);
      }
    }
  }

  return stored;
}

/**
 * Embed a query string for retrieval.
 * @param {string} queryText - Query to embed
 * @returns {Promise<number[]>} 768-dimension embedding vector
 */
async function embedQuery(queryText) {
  return embedText(queryText, 'RETRIEVAL_QUERY');
}

module.exports = { embedChunks, embedQuery, embedText };
