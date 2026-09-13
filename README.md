# ⚖️ AI Legal Assistant for Indian E-Courts

A full-stack AI-powered legal assistant for the Indian judiciary system, featuring **8,325+ law entries** across all major Indian acts with an advanced **NLP/Deep Learning retrieval pipeline**.

## 🚀 Live Features

- **AI Legal Chatbot** — Powered by Google Gemini with advanced NLP pipeline
- **8,325+ Indian Laws** — IPC, BNS 2023, CrPC, BNSS 2023, IEA, BSA 2023, Constitution, HMA, NIA, Consumer Protection, IT Act, DPDPA 2023, and 140+ more acts
- **Advanced NLP Pipeline** — Intent Classification → NER → Query Expansion → BM25 + Semantic Hybrid Retrieval → Gemini Re-ranking
- **Case Filing Assistant** — AI-guided case filing with relevant sections
- **Judgment Summarizer** — Upload and summarize court judgments
- **Legal Research** — Search across all major Indian laws
- **Role-based Access** — Citizen, Lawyer, Judge dashboards
- **Multi-language Support** — 17 Indian languages via Gemini

## 🧠 Advanced NLP Architecture

```
User Query
  ↓
Intent Classification (TF-IDF cosine similarity → 10 legal categories)
  ↓
Named Entity Recognition (Section refs, Acts, Courts, Parties)
  ↓
Query Expansion (Legal thesaurus + Section neighbours)
  ↓
Hybrid Retrieval:
  ├─ BM25 (Okapi BM25, k1=1.5, b=0.75) — Lexical precision
  ├─ TF-IDF Semantic Matching — Domain vocabulary
  ├─ NER-guided Lookup — Pinpoint accuracy
  └─ Intent-filtered Search — Categorical precision
  ↓
Reciprocal Rank Fusion (RRF, k=60)
  ↓
Gemini Cross-encoder Re-ranking
  ↓
Enriched Prompt → Gemini Structured Response → Response Formatter
  ↓
Clear Answer + Law Section Cards + Confidence Score
```

## 📁 Project Structure

```
project/
├── src/                          # React + TypeScript frontend
│   ├── pages/                    # All page components
│   │   ├── ChatbotPage.tsx        # AI chatbot with law cards
│   │   ├── DashboardPage.tsx      # Role-based dashboard
│   │   ├── CaseFilingPage.tsx     # AI case filing assistant
│   │   ├── SummarizerPage.tsx     # Judgment summarizer
│   │   └── ...
│   ├── services/                 # API services
│   │   ├── chatService.ts
│   │   ├── ipcService.ts          # Law section types
│   │   └── ...
│   └── components/               # Reusable components
├── backend/                      # Express.js + MongoDB
│   ├── services/
│   │   ├── legalAIService.js      # Main AI pipeline
│   │   ├── legalService.js        # Laws DB engine
│   │   ├── aiService.js           # Gemini integration
│   │   └── nlp/                  # Advanced NLP modules
│   │       ├── intentClassifier.js
│   │       ├── queryExpander.js
│   │       ├── legalNER.js
│   │       ├── bm25Ranker.js
│   │       ├── semanticMatcher.js
│   │       ├── hybridRetrieval.js
│   │       └── responseFormatter.js
│   ├── data/
│   │   ├── laws.json              # 8,325 law entries (Git LFS)
│   │   └── buildLawsDB.js        # Rebuild laws database
│   ├── models/                   # MongoDB schemas
│   ├── routes/                   # API routes
│   └── controllers/              # Request handlers
└── ...
```

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key (free at [makersuite.google.com](https://makersuite.google.com/app/apikey))

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/ai-legal-assistant.git
cd ai-legal-assistant
```

### 2. Setup Backend
```bash
cd backend
npm install

# Copy env template and fill in values
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY and MONGODB_URI
```

### 3. Build the Laws Database (first time only)
```bash
# This generates laws.json from source files
node data/buildLawsDB.js
```

### 4. Setup Frontend
```bash
cd ..
npm install
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:5000/api
```

### 5. Run both servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev        # Uses nodemon for hot reload
# or
npm start          # Production
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `GEMINI_API_KEY` | Google Gemini API key (**required**) |
| `FRONTEND_URL` | Frontend URL for CORS |

### Frontend (`.env`)
| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL |

## 🏛️ Laws Database

The system includes **8,325+ law entries** covering:

| Act | Entries | Coverage |
|-----|---------|----------|
| IPC 1860 / BNS 2023 | 822 + 822 | All chapters |
| CrPC 1973 / BNSS 2023 | 683 + 1487 | Full procedure |
| Indian Evidence Act / BSA 2023 | 386 + 407 | All sections |
| Constitution of India | 131+ | All Parts, Schedules, Key judgments |
| Motor Vehicles Act | 288 | Full sections |
| NIA / HMA / IDA | 188 + 89 + 75 | Complete |
| IT Act 2000 / DPDPA 2023 | 23 + 38 | Cyber law |
| + 130 more acts | 2000+ | Family, Labour, Tax, Environment... |

To rebuild the database:
```bash
cd backend
node data/buildLawsDB.js
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/send` | Send message to AI chatbot |
| GET | `/api/chat/sessions` | Get user's chat sessions |
| GET | `/api/laws?q=murder` | Search law database |
| GET | `/api/laws/acts` | List all available acts |
| GET | `/api/laws/:act/:section` | Get specific section |
| GET | `/api/ipc/:section` | Get IPC section (backward compat) |
| POST | `/api/case-filing/analyze` | Analyze case filing scenario |
| POST | `/api/summarizer/summarize` | Summarize a judgment document |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |

## 🛠️ Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS  
**Backend:** Node.js, Express.js, MongoDB/Mongoose  
**AI:** Google Gemini 1.5 Flash  
**NLP:** Custom BM25, TF-IDF Semantic Matching, Named Entity Recognition, Hybrid RRF Retrieval  
**Auth:** JWT tokens with refresh  

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

> ⚠️ **Disclaimer:** This AI tool provides legal information for research and educational purposes only. It is NOT a substitute for professional legal advice. Always consult a qualified advocate for specific legal matters.
