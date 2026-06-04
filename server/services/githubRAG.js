/**
 * GitHub RAG orchestrator — coordinates fetch, chunk, embed, and query.
 */
const { fetchUserRepos } = require('./githubFetcher');
const { chunkRepo } = require('./repoChunker');
const { embedChunks, embedQuery } = require('./embedder');
const RepoChunk = require('../models/RepoChunk');

/**
 * Ingest all repos for a user: fetch → chunk → embed → store.
 * Upserts by deleting old chunks for each repo before inserting new ones.
 *
 * @param {string} userId - MongoDB user ID
 * @param {string} accessToken - GitHub OAuth access token
 * @returns {Promise<{ reposProcessed: number, chunksStored: number }>}
 */
async function ingestUserRepos(userId, accessToken) {
  console.log(`[GitHubRAG] Starting ingestion for user ${userId}`);

  // 1. Fetch all repos
  const repos = await fetchUserRepos(accessToken);
  console.log(`[GitHubRAG] Fetched ${repos.length} repos`);

  let totalChunksStored = 0;

  // 2. For each repo: chunk → embed → store
  for (const repo of repos) {
    // Delete old chunks for this repo+user
    await RepoChunk.deleteMany({ userId, repoId: repo.repoId });

    // Generate chunks
    const chunks = chunkRepo(repo);

    // Embed and store
    const stored = await embedChunks(userId, chunks);
    totalChunksStored += stored;

    console.log(`[GitHubRAG] ${repo.repoId}: ${chunks.length} chunks → ${stored} stored`);
  }

  console.log(`[GitHubRAG] Ingestion complete: ${repos.length} repos, ${totalChunksStored} chunks`);

  return {
    reposProcessed: repos.length,
    chunksStored: totalChunksStored,
  };
}

/**
 * Query relevant chunks for a user using cosine similarity.
 * Falls back to in-memory cosine similarity if Atlas Vector Search is not available.
 *
 * @param {string} userId - MongoDB user ID
 * @param {string} queryText - The query string (JD + summary)
 * @param {number} topK - Number of results to return
 * @returns {Promise<Array>} Top-k chunk objects
 */
async function queryRelevantChunks(userId, queryText, topK = 6) {
  const queryEmbedding = await embedQuery(queryText);

  // Try Atlas Vector Search first
  try {
    const results = await RepoChunk.aggregate([
      {
        $vectorSearch: {
          index: 'embedding_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: topK * 10,
          limit: topK,
          filter: { userId: userId },
        },
      },
      {
        $project: {
          _id: 0,
          repoId: 1,
          repoName: 1,
          repoUrl: 1,
          chunkType: 1,
          text: 1,
          pushedAt: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);

    if (results.length > 0) return results;
  } catch (err) {
    console.warn('[GitHubRAG] Atlas Vector Search not available, using in-memory fallback:', err.message);
  }

  // Fallback: in-memory cosine similarity
  const allChunks = await RepoChunk.find({ userId }).lean();

  const scored = allChunks.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map(({ embedding, _id, __v, ...rest }) => rest);
}

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

module.exports = { ingestUserRepos, queryRelevantChunks };
