/**
 * Text chunker for GitHub repository data.
 * Splits repo data into embeddable chunks for RAG retrieval.
 */

// Rough token estimate: ~4 chars per token
const MAX_CHUNK_TOKENS = 800;
const MAX_CHUNK_CHARS = MAX_CHUNK_TOKENS * 4;

// Sections to skip in README
const SKIP_SECTIONS = ['license', 'contributing', 'credits', 'changelog'];

/**
 * Produce an array of chunk objects from one repo's data.
 * @param {object} repoData - RepoData object from githubFetcher
 * @returns {Array} Array of chunk objects
 */
function chunkRepo(repoData) {
  const chunks = [];
  const baseFields = {
    repoId: repoData.repoId,
    repoName: repoData.name,
    repoUrl: repoData.url,
    pushedAt: repoData.pushedAt,
  };

  // 1. Metadata chunk (always one per repo)
  const langKeys = Object.keys(repoData.languages || {});
  const metaText = [
    `Project: ${repoData.name}.`,
    repoData.description ? `Description: ${repoData.description}.` : '',
    langKeys.length ? `Tech stack: ${langKeys.join(', ')}.` : '',
    repoData.stars ? `Stars: ${repoData.stars}.` : '',
    repoData.forks ? `Forks: ${repoData.forks}.` : '',
    repoData.topics?.length ? `Topics: ${repoData.topics.join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  chunks.push({
    chunkType: 'metadata',
    text: metaText,
    ...baseFields,
  });

  // 2. README section chunks
  if (repoData.readmeText) {
    const readmeSections = splitByHeadings(repoData.readmeText);

    for (const section of readmeSections) {
      // Skip excluded sections
      const titleLower = section.title.toLowerCase().trim();
      if (SKIP_SECTIONS.some((skip) => titleLower.includes(skip))) continue;

      // Split long sections into sub-chunks
      const subChunks = splitLongText(section.text, MAX_CHUNK_CHARS);
      for (const subText of subChunks) {
        if (subText.trim().length < 20) continue; // Skip tiny fragments
        chunks.push({
          chunkType: 'readme_section',
          text: section.title ? `## ${section.title}\n${subText}` : subText,
          ...baseFields,
        });
      }
    }
  }

  // 3. Tech detail chunk
  const techParts = [];
  if (repoData.dependencies?.length) {
    techParts.push(`Dependencies and tech: ${repoData.dependencies.join(', ')}.`);
  }
  if (langKeys.length) {
    const totalBytes = Object.values(repoData.languages).reduce((a, b) => a + b, 0);
    const langBreakdown = langKeys
      .map((lang) => {
        const pct = Math.round((repoData.languages[lang] / totalBytes) * 100);
        return `${lang} (${pct}%)`;
      })
      .join(', ');
    techParts.push(`Primary languages: ${langBreakdown}.`);
  }

  if (techParts.length) {
    chunks.push({
      chunkType: 'tech_detail',
      text: techParts.join(' '),
      ...baseFields,
    });
  }

  return chunks;
}

/**
 * Split README text by H1/H2 headings into sections.
 */
function splitByHeadings(text) {
  const lines = text.split('\n');
  const sections = [];
  let currentTitle = '';
  let currentLines = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,2})\s+(.+)/);
    if (headingMatch) {
      // Save previous section
      if (currentLines.length > 0) {
        sections.push({ title: currentTitle, text: currentLines.join('\n').trim() });
      }
      currentTitle = headingMatch[2].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Save last section
  if (currentLines.length > 0) {
    sections.push({ title: currentTitle, text: currentLines.join('\n').trim() });
  }

  return sections;
}

/**
 * Split long text into chunks of max characters.
 * Tries to split at paragraph boundaries first, then sentence boundaries.
 */
function splitLongText(text, maxChars) {
  if (text.length <= maxChars) return [text];

  const chunks = [];
  let remaining = text;

  while (remaining.length > maxChars) {
    // Try to split at a paragraph boundary
    let splitIdx = remaining.lastIndexOf('\n\n', maxChars);
    if (splitIdx < maxChars * 0.3) {
      // If paragraph break is too early, try sentence boundary
      splitIdx = remaining.lastIndexOf('. ', maxChars);
    }
    if (splitIdx < maxChars * 0.3) {
      // If still too early, split at word boundary
      splitIdx = remaining.lastIndexOf(' ', maxChars);
    }
    if (splitIdx < 1) {
      splitIdx = maxChars; // Hard split as last resort
    }

    chunks.push(remaining.substring(0, splitIdx).trim());
    remaining = remaining.substring(splitIdx).trim();
  }

  if (remaining.trim()) {
    chunks.push(remaining.trim());
  }

  return chunks;
}

module.exports = { chunkRepo };
