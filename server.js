require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Multer config — store in memory (no disk writes needed)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"), false);
  },
});

// ──────────────────────────────────────────────
// Helper: Call Gemini with retry
// ──────────────────────────────────────────────
async function callGemini(prompt) {
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ──────────────────────────────────────────────
// POST /api/parse-resume
// Body: multipart/form-data  →  field "resume" (PDF)
// Returns: { text: string }
// ──────────────────────────────────────────────
app.post("/api/parse-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF file uploaded" });

    const data = await pdfParse(req.file.buffer);
    res.json({ text: data.text, pages: data.numpages });
  } catch (err) {
    console.error("PDF parse error:", err);
    res.status(500).json({ error: "Failed to parse PDF: " + err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/analyze
// Body: { resumeText: string, jobDescription: string }
// Returns: full analysis object with all features
// ──────────────────────────────────────────────
app.post("/api/analyze", async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: "resumeText and jobDescription are required" });
    }

    const prompt = `
You are an expert resume coach, ATS specialist, and career advisor.

Analyze the following resume against the job description and return a comprehensive JSON object.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "matchScore": <integer 0-100>,
  "matchScoreReason": "<1-2 sentence explanation of the score>",
  "optimizedResume": "<full rewritten resume text, well-formatted with sections, optimized for this job>",
  "keyChanges": ["<change 1>", "<change 2>", ...],
  "skillGaps": [
    {
      "skill": "<skill name>",
      "importance": "<high|medium|low>",
      "suggestion": "<how to acquire or demonstrate this skill>"
    }
  ],
  "atsFlags": [
    {
      "issue": "<ATS issue description>",
      "severity": "<high|medium|low>",
      "fix": "<how to fix it>"
    }
  ],
  "coverLetter": "<a full tailored cover letter for this job, professional and personalized>",
  "topKeywords": ["<keyword1>", "<keyword2>", ...],
  "missingKeywords": ["<keyword1>", "<keyword2>", ...]
}
`;

    const raw = await callGemini(prompt);

    // Strip any accidental markdown code fences
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(cleaned);

    res.json(analysis);
  } catch (err) {
    console.error("Analysis error:", err);
    res.status(500).json({ error: "Analysis failed: " + err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/rewrite-section
// Body: { sectionText: string, jobDescription: string, sectionType: string }
// Returns: { rewritten: string }
// ──────────────────────────────────────────────
app.post("/api/rewrite-section", async (req, res) => {
  try {
    const { sectionText, jobDescription, sectionType } = req.body;
    if (!sectionText || !jobDescription) {
      return res.status(400).json({ error: "sectionText and jobDescription are required" });
    }

    const prompt = `
You are an expert resume writer. Rewrite the following resume ${sectionType || "section"} to better align with the job description.
Use strong action verbs, quantify achievements where possible, and incorporate relevant keywords naturally.

JOB DESCRIPTION:
${jobDescription}

ORIGINAL SECTION:
${sectionText}

Return ONLY the rewritten section text, no explanations.
`;

    const rewritten = await callGemini(prompt);
    res.json({ rewritten: rewritten.trim() });
  } catch (err) {
    console.error("Rewrite error:", err);
    res.status(500).json({ error: "Rewrite failed: " + err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/health
// ──────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`✅ Resume Platform Backend running on http://localhost:${PORT}`);
});
