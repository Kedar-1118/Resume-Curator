const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Clean extracted resume text by removing artifacts and normalizing whitespace.
 * @param {string} rawText - Raw extracted text
 * @returns {string} Cleaned text
 */
function cleanResumeText(rawText) {
  if (!rawText) return '';

  let lines = rawText.split('\n');

  // 1. Remove page numbers: lines that are purely numeric or match "Page X of Y"
  lines = lines.filter((line) => {
    const trimmed = line.trim();
    if (/^\d+$/.test(trimmed)) return false;
    if (/^page\s+\d+\s+(of|\/)\s+\d+$/i.test(trimmed)) return false;
    return true;
  });

  // 2. Remove repeated header/footer lines (appear 3+ times identically)
  const lineCounts = {};
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      lineCounts[trimmed] = (lineCounts[trimmed] || 0) + 1;
    }
  });
  lines = lines.filter((line) => {
    const trimmed = line.trim();
    return trimmed.length === 0 || (lineCounts[trimmed] || 0) < 3;
  });

  // 3. Remove watermark artifacts: lines of only uppercase short words repeated
  lines = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    // Match lines like "DRAFT DRAFT DRAFT" or "CONFIDENTIAL CONFIDENTIAL"
    const words = trimmed.split(/\s+/);
    if (words.length >= 2 && words.every((w) => /^[A-Z]{1,4}$/.test(w))) {
      const unique = new Set(words);
      if (unique.size === 1) return false;
    }
    return true;
  });

  // 4. Normalize whitespace: trim each line, collapse 3+ consecutive newlines to 2
  let text = lines.map((l) => l.trimEnd()).join('\n');
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Detect if extracted text is from a LinkedIn PDF export.
 * @param {string} text - Extracted text
 * @returns {string} 'linkedin' or 'generic'
 */
function detectSourceFormat(text) {
  const headerText = text.substring(0, 500);
  if (headerText.includes('linkedin.com/in/')) return 'linkedin';

  const linkedInSections = ['Experience', 'Education', 'Licenses & Certifications'];
  const matchCount = linkedInSections.filter((s) => headerText.includes(s)).length;
  if (matchCount >= 2) return 'linkedin';

  return 'generic';
}

/**
 * Extract plain text from a PDF or DOCX buffer.
 * Returns the cleaned text and detected source format.
 *
 * @param {Buffer} buffer   - File buffer
 * @param {string} mimetype - MIME type of the file
 * @returns {Promise<{ text: string, sourceFormat: string }>} Extracted text + format
 */
async function extractText(buffer, mimetype) {
  let rawText = '';

  if (mimetype === 'application/pdf') {
    const result = await pdfParse(buffer);
    rawText = result.text || '';
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    rawText = result.value || '';
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
  }

  const text = cleanResumeText(rawText);
  const sourceFormat = detectSourceFormat(text);

  return { text, sourceFormat };
}

module.exports = { extractText, cleanResumeText, detectSourceFormat };
