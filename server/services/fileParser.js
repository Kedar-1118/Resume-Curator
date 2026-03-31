const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract plain text from a PDF or DOCX buffer.
 * @param {Buffer} buffer - File buffer
 * @param {string} mimetype - MIME type of the file
 * @returns {Promise<string>} Extracted text
 */
async function extractText(buffer, mimetype) {
  if (mimetype === 'application/pdf') {
    const parser = new PDFParse({ data: buffer, verbosity: 0 });
    const result = await parser.getText();
    await parser.destroy();
    return result.text.trim();
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
}

module.exports = { extractText };

