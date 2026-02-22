# 🚀 ResumeAI — AI-Powered Resume Enhancement Platform

> Tailor your resume to any job description in seconds using Gemini AI. Beat ATS systems, close skill gaps, and land more interviews.

---

## ✨ Features

| Feature | Description |
|---|---|
| **PDF Resume Parsing** | Upload any PDF resume — text is extracted automatically |
| **AI Resume Optimization** | Full resume rewrite tailored to the job description |
| **Match Score** | Percentage-based similarity score between resume and job |
| **Key Changes Summary** | Bullet-by-bullet breakdown of what was improved |
| **Skill Gap Analyzer** | Identifies missing skills/certifications with priority ratings |
| **ATS Simulation** | Flags sections likely to be rejected by ATS parsers |
| **Keyword Analysis** | Shows matched and missing job keywords |
| **Cover Letter Generator** | Tailored cover letter based on resume + job description |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Axios, CSS3 |
| **Backend** | Node.js, Express |
| **AI / LLM** | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| **PDF Parsing** | `pdf-parse` |
| **File Handling** | `multer` (in-memory, no disk writes) |

---

## 📁 Project Structure

```
resume-platform/
├── backend/
│   ├── server.js          # Express API server
│   ├── package.json
│   └── .env.example       # Environment variable template
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js          # Main React component (all UI logic)
    │   ├── App.css         # All styles
    │   └── index.js        # React entry point
    └── package.json
```

---

## ⚡ Setup Instructions

### Prerequisites
- Node.js v18+ installed
- A Google Gemini API key — get one free at https://aistudio.google.com/app/apikey

---

### 1. Clone / Download the project

```bash
git clone <repo-url>
cd resume-platform
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Open `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=5000
```

Start the backend:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Backend will run on **http://localhost:5000**

---

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

Frontend will run on **http://localhost:3000** and automatically open in your browser.

---

### 4. (Optional) Custom API URL

If your backend runs on a different port or host, create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🌐 API Endpoints

### `GET /api/health`

Health check — confirms the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

### `POST /api/parse-resume`

Parse a PDF resume and extract text.

**Request:** `multipart/form-data`
| Field | Type | Required | Description |
|---|---|---|---|
| `resume` | File (PDF) | ✅ | The resume PDF file (max 10MB) |

**Response:**
```json
{
  "text": "John Doe\nSoftware Engineer\n...",
  "pages": 2
}
```

**Error Responses:**
- `400` — No file uploaded or invalid file type
- `500` — PDF parsing failed

---

### `POST /api/analyze`

Full AI analysis: rewrite resume, match score, skill gaps, ATS check, cover letter.

**Request:** `application/json`
```json
{
  "resumeText": "John Doe\nSoftware Engineer with 5 years...",
  "jobDescription": "We are looking for a Senior Engineer..."
}
```

**Response:**
```json
{
  "matchScore": 72,
  "matchScoreReason": "Strong technical alignment but missing cloud experience.",
  "optimizedResume": "John Doe\nSenior Software Engineer\n...",
  "keyChanges": [
    "Added AWS keywords throughout experience section",
    "Quantified achievements with metrics"
  ],
  "skillGaps": [
    {
      "skill": "AWS Cloud Services",
      "importance": "high",
      "suggestion": "Pursue AWS Solutions Architect certification on Coursera"
    }
  ],
  "atsFlags": [
    {
      "issue": "Resume uses tables which many ATS systems cannot parse",
      "severity": "high",
      "fix": "Replace tables with plain text bullet points"
    }
  ],
  "coverLetter": "Dear Hiring Manager,\n\nI am excited to apply for...",
  "topKeywords": ["React", "Node.js", "AWS", "Agile"],
  "missingKeywords": ["Kubernetes", "GraphQL"]
}
```

**Error Responses:**
- `400` — Missing `resumeText` or `jobDescription`
- `500` — AI analysis failed

---

### `POST /api/rewrite-section`

Rewrite a specific resume section (optional, for targeted edits).

**Request:** `application/json`
```json
{
  "sectionText": "Led a team of 3 developers building web apps.",
  "jobDescription": "Looking for a senior engineer to lead backend systems...",
  "sectionType": "work experience"
}
```

**Response:**
```json
{
  "rewritten": "Spearheaded a cross-functional team of 3 engineers delivering scalable backend APIs, reducing load time by 40%..."
}
```

---

## 🔒 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ | — | Google Gemini API key |
| `PORT` | ❌ | `5000` | Backend server port |

---

## 🧠 How It Works

1. **User uploads** a PDF resume → backend parses it with `pdf-parse`
2. **User pastes** a job description into the text area
3. **Frontend** sends both to `POST /api/analyze`
4. **Backend** constructs a structured prompt and calls Gemini 1.5 Flash
5. **Gemini** returns a JSON object with all analysis results
6. **Frontend** renders:
   - A circular match score gauge
   - The full optimized resume (with copy button)
   - Key changes summary
   - Skill gap cards with priority indicators
   - ATS flag report with severity ratings
   - Keyword match / miss visualization
   - A full tailored cover letter

---

## 🛠️ Development Notes

- **No authentication required** — all endpoints are open
- **No database required** — stateless, all processing happens per-request
- **No file storage** — PDFs are held in memory only, never written to disk
- The Gemini model used is `gemini-1.5-flash` — fast and cost-effective
- Frontend proxies API calls to `localhost:5000` (set in `package.json`)

---

## 📦 Dependencies

### Backend
| Package | Version | Purpose |
|---|---|---|
| `express` | ^4.19 | HTTP server |
| `cors` | ^2.8 | Cross-origin requests |
| `multer` | ^1.4 | PDF file upload handling |
| `pdf-parse` | ^1.1 | PDF text extraction |
| `@google/generative-ai` | ^0.21 | Gemini AI SDK |
| `dotenv` | ^16.4 | Environment variables |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| `react` | ^18.3 | UI framework |
| `axios` | ^1.7 | HTTP client |

---

## 🚀 Production Deployment

### Backend (e.g., Railway, Render, Fly.io)
1. Set `GEMINI_API_KEY` environment variable in your platform
2. Run `npm start`

### Frontend (e.g., Vercel, Netlify)
1. Set `REACT_APP_API_URL=https://your-backend-url.com/api`
2. Run `npm run build` and deploy the `build/` folder

---

## 📄 License

MIT — free to use and modify.
