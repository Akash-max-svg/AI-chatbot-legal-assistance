# AI Legal Assistant - Backend

A comprehensive Node.js/Express.js backend for the AI Legal Assistant application with MongoDB, JWT authentication, and Gemini AI integration.

## Features

- **Authentication**: JWT-based authentication with refresh tokens, bcrypt password hashing, email verification, and password reset
- **Role-Based Access Control**: Support for Citizen, Lawyer, Judge, and Admin roles
- **AI Integration**: Google Gemini AI for legal chatbot, document summarization, case analysis, and knowledge base
- **Multi-language Support**: English, Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Urdu, Bengali, Gujarati
- **Document Processing**: PDF, DOCX, and TXT file extraction and analysis
- **Knowledge Base**: Comprehensive legal knowledge with categories, acts, sections, and FAQs

## Project Structure

```
backend/
├── server.js                 # Main server entry point
├── package.json               # Dependencies
├── config/
│   ├── database.js           # MongoDB connection
│   └── email.js              # Nodemailer configuration
├── models/                   # MongoDB models
│   ├── User.js
│   ├── Case.js
│   ├── CaseDocument.js
│   ├── Document.js
│   ├── Judgement.js
│   ├── Evidence.js
│   ├── Notification.js
│   ├── KnowledgeBase.js
│   ├── ChatHistory.js
│   ├── Feedback.js
│   ├── Summary.js
│   ├── VoiceLog.js
│   ├── LanguageSetting.js
│   └── GovernmentAct.js
├── controllers/              # Request handlers
├── routes/                   # API routes
├── middleware/               # Express middleware
│   ├── auth.js              # JWT authentication
│   ├── validate.js          # Request validation
│   ├── rateLimiter.js       # Rate limiting
│   ├── upload.js            # File upload handling
│   └── errorHandler.js      # Custom errors
└── services/                 # Business logic
    ├── aiService.js         # Gemini AI integration
    ├── legalAIService.js    # Legal AI operations
    ├── documentService.js   # Auth service
    └── fileProcessor.js     # Document extraction
```

## Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/legal_assistant
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173

# Gemini AI API
GEMINI_API_KEY=your-gemini-api-key

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=AI Legal Assistant <noreply@legalassistant.com>
```

3. Start MongoDB:
```bash
mongod
```

4. Start the server:
```bash
npm run dev  # Development (with nodemon)
npm start    # Production
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user

### Chat
- `POST /api/chat/send` - Send chat message
- `GET /api/chat/sessions` - Get chat sessions
- `GET /api/chat/sessions/:id/messages` - Get session messages
- `DELETE /api/chat/sessions/:id` - Delete session

### Knowledge Base
- `GET /api/knowledge/search` - Search knowledge
- `POST /api/knowledge/ask` - Ask AI question
- `GET /api/knowledge/categories` - Get categories
- `GET /api/knowledge/acts` - Get acts
- `GET /api/knowledge/:id` - Get article

### Case Filing
- `POST /api/case-filing/analyze` - Analyze case with AI
- `GET /api/cases` - Get all cases
- `GET /api/cases/:id` - Get case
- `POST /api/case-filing` - Create case
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case

### Summarizer
- `POST /api/summarizer` - Summarize document
- `GET /api/summarizer` - Get summaries
- `GET /api/summarizer/:id` - Get summary
- `DELETE /api/summarizer/:id` - Delete summary

### Voice
- `POST /api/voice/query` - Process voice query
- `GET /api/voice/history` - Get voice history
- `POST /api/voice/detect-language` - Detect language

### Documents
- `GET /api/documents` - Get documents
- `GET /api/documents/:id` - Get document
- `POST /api/documents` - Create document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/generate` - Generate document with AI

### Users (Admin)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id/role` - Update user role
- `DELETE /api/users/:id` - Deactivate user

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard stats
- `GET /api/dashboard/status` - Get system status
- `GET /api/dashboard/activity` - Get recent activity

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback/me` - Get my feedback
- `GET /api/feedback` - Get all feedback (Admin)
- `PUT /api/feedback/:id` - Update feedback status (Admin)

### Government
- `GET /api/government/judgements/latest` - Get latest judgements
- `GET /api/government/judgements/search` - Search judgements
- `GET /api/government/acts` - Get acts and rules
- `GET /api/government/notices` - Get notices
- `GET /api/government/faqs` - Get FAQs

## Role-Based Access

### Citizen
- File new cases
- Track case status
- Upload documents
- Use AI chatbot
- Access knowledge base
- Voice assistant
- Feedback submission

### Lawyer
- Client management
- Assigned cases
- Upload documents
- AI legal research
- Document summarizer
- Judgement search
- Evidence management
- Knowledge base access

### Judge
- Assigned cases
- Hearing schedule
- Case documents
- Evidence viewer
- AI judgment draft assistant
- AI legal research
- Previous judgements
- Document summarizer
- Note: CANNOT file cases

### Admin
- User management
- Case management
- Judge/Lawyer approval
- Reports and analytics
- Feedback management
- AI usage statistics
- Knowledge base management

## Dependencies

- express - Web framework
- mongoose - MongoDB ODM
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- @google/generative-ai - Gemini AI
- nodemailer - Email service
- multer - File uploads
- pdf-parse - PDF extraction
- mammoth - DOCX extraction
- express-validator - Request validation
- cors - CORS handling
- dotenv - Environment variables

## Development

### Running Tests
```bash
npm test
```

### Production Deployment
1. Set production environment variables
2. Use PM2 or similar process manager
3. Set up MongoDB replica set
4. Configure email service
5. Obtain Gemini API key
