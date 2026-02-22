import React, { useState, useRef, useCallback } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ─── Helper Components ──────────────────────────────────────────────────────

function ScoreCircle({ score }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 75 ? "#34d399" : score >= 50 ? "#f59e0b" : "#f87171";

  return (
    <div className="score-circle">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="score-number" style={{ color }}>{score}</span>
      <span className="score-label">/ 100</span>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="btn-copy" onClick={handleCopy}>
      {copied ? "✓ Copied!" : "⎘ Copy"}
    </button>
  );
}

// ─── Upload Zone ─────────────────────────────────────────────────────────────

function UploadZone({ file, onFile }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") onFile(dropped);
  }, [onFile]);

  return (
    <div
      className={`upload-zone ${dragging ? "drag-over" : ""} ${file ? "has-file" : ""}`}
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={(e) => onFile(e.target.files[0])}
      />
      <div className="upload-icon">
        {file ? "✓" : "⬆"}
      </div>
      {file ? (
        <>
          <div className="upload-label" style={{ color: "#34d399" }}>📄 {file.name}</div>
          <div className="upload-hint">Click to change file</div>
        </>
      ) : (
        <>
          <div className="upload-label">Drop your resume PDF here</div>
          <div className="upload-hint">or click to browse • PDF only • max 10MB</div>
        </>
      )}
    </div>
  );
}

// ─── Results Tabs ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "resume", label: "✨ Optimized Resume", icon: "📄" },
  { id: "changes", label: "Key Changes", icon: "📝" },
  { id: "skills", label: "Skill Gaps", icon: "🎯" },
  { id: "ats", label: "ATS Analysis", icon: "🤖" },
  { id: "keywords", label: "Keywords", icon: "🔑" },
  { id: "cover", label: "Cover Letter", icon: "✉️" },
];

function ResultsView({ data, onReset }) {
  const [activeTab, setActiveTab] = useState("resume");
  const score = data.matchScore || 0;
  const scoreColor = score >= 75 ? "#34d399" : score >= 50 ? "#f59e0b" : "#f87171";

  const renderTab = () => {
    switch (activeTab) {
      case "resume":
        return (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="card-title">✨ AI-Optimized Resume</div>
              <CopyButton text={data.optimizedResume} />
            </div>
            <div className="resume-output">{data.optimizedResume}</div>
          </div>
        );

      case "changes":
        return (
          <div className="card">
            <div className="card-title">📝 Key Changes Made</div>
            <div className="card-subtitle">What the AI improved in your resume</div>
            <div className="changes-list">
              {(data.keyChanges || []).map((c, i) => (
                <div key={i} className="change-item">
                  <div className="change-dot" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "skills":
        return (
          <div className="card">
            <div className="card-title">🎯 Skill Gap Analysis</div>
            <div className="card-subtitle">Skills to acquire to better match this role</div>
            <div className="skill-list">
              {(data.skillGaps || []).length === 0 ? (
                <p style={{ color: "#34d399", fontSize: 14 }}>🎉 No significant skill gaps detected!</p>
              ) : (
                data.skillGaps.map((s, i) => (
                  <div key={i} className="skill-item">
                    <span className={`skill-badge ${s.importance}`}>{s.importance}</span>
                    <div className="skill-content">
                      <h4>{s.skill}</h4>
                      <p>{s.suggestion}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case "ats":
        return (
          <div className="card">
            <div className="card-title">🤖 ATS Simulation Report</div>
            <div className="card-subtitle">Issues that may cause ATS rejection</div>
            <div className="ats-list">
              {(data.atsFlags || []).length === 0 ? (
                <p style={{ color: "#34d399", fontSize: 14 }}>✅ Your resume looks ATS-friendly!</p>
              ) : (
                data.atsFlags.map((f, i) => (
                  <div key={i} className={`ats-item ${f.severity}`}>
                    <div className="ats-header">
                      <span className="ats-severity">{f.severity}</span>
                      <span className="ats-issue">{f.issue}</span>
                    </div>
                    <div className="ats-fix">💡 Fix: {f.fix}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case "keywords":
        return (
          <div className="card">
            <div className="card-title">🔑 Keyword Analysis</div>
            <div className="card-subtitle" style={{ marginBottom: 20 }}>
              <strong style={{ color: "#34d399" }}>Green</strong> = found in your resume &nbsp;|&nbsp;
              <strong style={{ color: "#f87171" }}>Red</strong> = missing from your resume
            </div>
            {data.topKeywords?.length > 0 && (
              <>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>Top job keywords:</p>
                <div className="keywords-grid">
                  {data.topKeywords.map((k, i) => (
                    <span key={i} className="keyword-tag found">{k}</span>
                  ))}
                </div>
              </>
            )}
            {data.missingKeywords?.length > 0 && (
              <>
                <p style={{ fontSize: 13, color: "#64748b", margin: "16px 0 8px" }}>Missing keywords:</p>
                <div className="keywords-grid">
                  {data.missingKeywords.map((k, i) => (
                    <span key={i} className="keyword-tag missing">{k}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        );

      case "cover":
        return (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="card-title">✉️ Tailored Cover Letter</div>
              <CopyButton text={data.coverLetter} />
            </div>
            <div className="cover-letter-output">{data.coverLetter}</div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {/* Match Score */}
      <div className="score-section">
        <div className="score-card">
          <ScoreCircle score={score} />
          <div className="score-info">
            <h3>Resume Match Score</h3>
            <p>{data.matchScoreReason}</p>
            <div className="score-bar-wrap">
              <div className="score-bar-bg">
                <div
                  className="score-bar-fill"
                  style={{ width: `${score}%`, background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}99)` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {renderTab()}

      <div className="reset-section">
        <button className="btn-secondary" onClick={onReset}>
          ← Start Over with New Resume
        </button>
      </div>
    </div>
  );
}

// ─── Loading View ─────────────────────────────────────────────────────────────

function LoadingView() {
  const steps = [
    "Parsing your resume...",
    "Analyzing job description...",
    "Calculating match score...",
    "Optimizing resume content...",
    "Running ATS simulation...",
    "Generating cover letter...",
  ];
  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
      <div className="loading-title">Analyzing Your Resume</div>
      <div className="loading-sub">Gemini AI is working its magic...</div>
      <div className="loading-steps">
        {steps.map((s, i) => (
          <div key={i} className={`loading-step ${i === activeStep ? "active" : ""}`}>
            {i < activeStep ? "✓" : i === activeStep ? <div className="pulse-dot" /> : "○"}
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const step = results ? 3 : loading ? 2 : resumeFile || jobDesc ? 1 : 0;

  const handleAnalyze = async () => {
    if (!resumeFile || !jobDesc.trim()) {
      setError("Please upload your resume and paste the job description.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // Step 1: Parse PDF
      const formData = new FormData();
      formData.append("resume", resumeFile);
      const parseRes = await axios.post(`${API_BASE}/parse-resume`, formData);
      const resumeText = parseRes.data.text;

      if (!resumeText || resumeText.trim().length < 50) {
        throw new Error("Could not extract text from PDF. Please try a different file.");
      }

      // Step 2: Full analysis
      const analyzeRes = await axios.post(`${API_BASE}/analyze`, {
        resumeText,
        jobDescription: jobDesc,
      });

      setResults(analyzeRes.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setResumeFile(null);
    setJobDesc("");
    setError("");
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">R</div>
          ResumeAI
        </div>
        <div className="header-badge">Powered by Gemini AI</div>
      </header>

      {!results && !loading && (
        <>
          {/* Hero */}
          <section className="hero">
            <h1>
              Land More Interviews with <span>AI-Optimized</span> Resumes
            </h1>
            <p>
              Upload your resume and paste the job description. Our AI analyzes, rewrites,
              and tailors your resume to beat ATS systems and impress recruiters.
            </p>
          </section>

          {/* Steps */}
          <div className="steps-bar">
            {["Upload Resume", "Add Job Description", "Get Analysis"].map((label, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="step-connector" />}
                <div className={`step-item ${step > i ? "done" : step === i ? "active" : ""}`}>
                  <div className="step-dot">{step > i ? "✓" : i + 1}</div>
                  <span>{label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </>
      )}

      <main className="main">
        {loading ? (
          <LoadingView />
        ) : results ? (
          <ResultsView data={results} onReset={handleReset} />
        ) : (
          <>
            {error && (
              <div className="error-banner">
                ⚠️ {error}
              </div>
            )}

            <div className="input-grid">
              <div className="card">
                <div className="card-title">📄 Your Resume</div>
                <div className="card-subtitle">Upload your current resume as a PDF</div>
                <UploadZone file={resumeFile} onFile={setResumeFile} />
              </div>

              <div className="card">
                <div className="card-title">💼 Job Description</div>
                <div className="card-subtitle">Paste the full job posting you're applying to</div>
                <textarea
                  placeholder="Paste the full job description here...

Example:
We're looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and AWS. You'll lead a team of engineers building our core platform..."
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  rows={8}
                />
              </div>
            </div>

            <div className="btn-center">
              <button
                className="btn-primary"
                onClick={handleAnalyze}
                disabled={!resumeFile || !jobDesc.trim()}
              >
                ✨ Analyze & Enhance My Resume
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
