const Summary = require('../models/Summary');
const Document = require('../models/Document');
const legalAI = require('../services/legalAIService');
const { extractTextFromFile } = require('../services/fileProcessor');
const path = require('path');

async function summarizeDocument(req, res) {
  try {
    const filePath = req.file?.path;
    const fileContent = req.body?.content;

    if (!filePath && !fileContent) {
      return res.status(400).json({ error: 'File or content required' });
    }

    let text = fileContent;

    if (filePath) {
      text = await extractTextFromFile(filePath, req.file.mimetype);
    }

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'Not enough text content to summarize' });
    }

    const startTime = Date.now();
    const result = await legalAI.summarizeJudgment(text, req.body.language || 'en');
    const processingTime = Date.now() - startTime;

    const summary = new Summary({
      user: req.user._id,
      documentTitle: result.caseTitle || req.file?.originalname || 'Unknown',
      originalFileUrl: filePath ? `/uploads/${path.basename(filePath)}` : undefined,
      originalFileName: req.file?.originalname,
      extractedText: text.substring(0, 10000),
      caseTitle: result.caseTitle,
      court: result.court,
      date: result.date,
      summary: {
        facts: result.facts,
        issues: result.issues,
        arguments: result.arguments,
        evidence: result.evidence,
        reasoning: result.reasoning,
        applicableLaws: result.applicableLaws,
        courtDecision: result.courtDecision,
        judgmentOutcome: result.judgmentOutcome,
        importantCitations: result.importantCitations
      },
      structured: [
        { heading: 'Facts', content: result.facts },
        { heading: 'Issues', content: result.issues },
        { heading: 'Arguments', content: result.arguments },
        { heading: 'Evidence', content: result.evidence },
        { heading: 'Reasoning', content: result.reasoning },
        { heading: 'Applicable Laws', content: (result.applicableLaws || []).join('\n') },
        { heading: 'Court Decision', content: result.courtDecision },
        { heading: 'Judgment Outcome', content: result.judgmentOutcome },
        { heading: 'Important Citations', content: (result.importantCitations || []).join('\n') }
      ].filter(s => s.content && s.content.trim()),
      recommendations: result.recommendations,
      processingTime
    });

    await summary.save();

    res.json({
      summary: {
        id: summary._id,
        caseTitle: result.caseTitle,
        court: result.court,
        date: result.date,
        sections: summary.structured,
        recommendations: result.recommendations
      },
      processingTime
    });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ error: error.message || 'Failed to summarize document' });
  }
}

async function getSummaries(req, res) {
  try {
    const summaries = await Summary.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('documentTitle caseTitle court date createdAt processingTime')
      .lean();

    res.json({ summaries });
  } catch (error) {
    console.error('Get summaries error:', error);
    res.status(500).json({ error: 'Failed to get summaries' });
  }
}

async function getSummary(req, res) {
  try {
    const summary = await Summary.findOne({ _id: req.params.id, user: req.user._id });

    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    res.json({ summary });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Failed to get summary' });
  }
}

async function deleteSummary(req, res) {
  try {
    await Summary.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Summary deleted' });
  } catch (error) {
    console.error('Delete summary error:', error);
    res.status(500).json({ error: 'Failed to delete summary' });
  }
}

module.exports = {
  summarizeDocument,
  getSummaries,
  getSummary,
  deleteSummary
};
