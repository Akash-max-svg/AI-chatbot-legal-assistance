const Document = require('../models/Document');
const legalAI = require('../services/legalAIService');
const { handleUpload, uploadSingle } = require('../middleware/upload');
const path = require('path');

async function getDocuments(req, res) {
  try {
    const { type, status, limit = 20, skip = 0 } = req.query;

    let query = { user: req.user._id };
    if (type) query.type = type;
    if (status) query.status = status;

    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    const total = await Document.countDocuments(query);

    res.json({ documents, total });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
}

async function getDocument(req, res) {
  try {
    const document = await Document.findOne({ _id: req.params.id, user: req.user._id });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
}

async function createDocument(req, res) {
  try {
    const { title, type, content, fileUrl, fileName, metadata } = req.body;

    const document = new Document({
      user: req.user._id,
      title,
      type,
      content,
      fileUrl,
      fileName,
      metadata,
      status: 'Draft'
    });

    await document.save();

    res.status(201).json({ document });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
}

async function updateDocument(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const document = await Document.findOneAndUpdate(
      { _id: id, user: req.user._id },
      updates,
      { new: true }
    );

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
}

async function deleteDocument(req, res) {
  try {
    await Document.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
}

async function generateDocument(req, res) {
  try {
    const { documentType, details, language } = req.body;

    const generatedDoc = await legalAI.generateLegalDocument(documentType, details, language || 'en');

    const document = new Document({
      user: req.user._id,
      title: `${documentType} - ${details.title || 'Generated'}`,
      type: documentType.toLowerCase().replace(/\\s+/g, '-'),
      content: generatedDoc,
      aiGenerated: true,
      status: 'Draft',
      metadata: details
    });

    await document.save();

    res.json({ document });
  } catch (error) {
    console.error('Generate document error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate document' });
  }
}

module.exports = {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  generateDocument
};
