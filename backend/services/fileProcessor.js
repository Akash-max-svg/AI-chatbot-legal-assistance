const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function extractTextFromFile(filePath, mimeType) {
  try {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf' || mimeType === 'application/pdf') {
      return await extractPdfText(filePath);
    }

    if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return await extractDocxText(filePath);
    }

    if (ext === '.doc') {
      // .doc files need special handling (older Word format)
      return await extractDocxText(filePath); // Try mammoth for .doc too
    }

    if (ext === '.txt' || mimeType === 'text/plain') {
      return await extractTextText(filePath);
    }

    // Default to reading as text
    return await extractTextText(filePath);
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

async function extractPdfText(filePath) {
  const buffer = await fs.readFile(filePath);

  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF. It may be a scanned document or password protected.');
  }
}

async function extractDocxText(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

async function extractTextText(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return content;
}

function getFileExtension(filename) {
  return path.extname(filename).toLowerCase();
}

function getMimeType(filename) {
  const ext = getFileExtension(filename);
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.txt': 'text/plain',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

async function getFileInfo(filePath) {
  const stats = await fs.stat(filePath);
  const filename = path.basename(filePath);

  return {
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime,
    extension: getFileExtension(filename),
    mimeType: getMimeType(filename)
  };
}

async function cleanupFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error cleaning up file:', error);
  }
}

module.exports = {
  extractTextFromFile,
  extractPdfText,
  extractDocxText,
  extractTextText,
  getFileExtension,
  getMimeType,
  getFileInfo,
  cleanupFile
};
