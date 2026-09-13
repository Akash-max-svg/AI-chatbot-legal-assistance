require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const caseRoutes = require('./routes/cases');
const documentRoutes = require('./routes/documents');
const chatRoutes = require('./routes/chat');
const knowledgeRoutes = require('./routes/knowledge');
const summarizerRoutes = require('./routes/summarizer');
const caseFilingRoutes = require('./routes/caseFiling');
const notificationRoutes = require('./routes/notifications');
const voiceRoutes = require('./routes/voice');
const feedbackRoutes = require('./routes/feedback');
const dashboardRoutes = require('./routes/dashboard');
const governmentRoutes = require('./routes/government');
const languageRoutes = require('./routes/languages');
const ipcRoutes      = require('./routes/ipc');
const lawsRoutes     = require('./routes/laws');
const ragRoutes      = require('./routes/rag');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/legal_assistant';

async function connectDatabase() {
  const shouldUseMemoryDb = !process.env.MONGODB_URI;

  try {
    if (shouldUseMemoryDb) {
      console.log('No MongoDB URI configured. Starting in-memory MongoDB for local development.');
      const memoryServer = await MongoMemoryServer.create();
      await mongoose.connect(memoryServer.getUri());
      console.log('Connected to in-memory MongoDB');
      return;
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);

    if (!shouldUseMemoryDb) {
      console.log('Falling back to in-memory MongoDB for local development.');
      const memoryServer = await MongoMemoryServer.create();
      await mongoose.connect(memoryServer.getUri());
      console.log('Connected to in-memory MongoDB after fallback');
      return;
    }

    throw error;
  }
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/summarizer', summarizerRoutes);
app.use('/api/case-filing', caseFilingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/government', governmentRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/ipc',      ipcRoutes);
app.use('/api/laws',     lawsRoutes);
app.use('/api/rag',      ragRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

connectDatabase()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start backend:', error);
    process.exit(1);
  });

module.exports = app;
