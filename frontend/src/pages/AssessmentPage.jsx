import { useState, useEffect } from "react";
import { assessmentService } from "../services";
import toast from "react-hot-toast";
import {
  ClipboardCheck,
  Target,
  Award,
  ThumbsUp,
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BookOpen,
  Terminal,
  BarChart2,
  Globe,
  Trophy,
  History,
} from "lucide-react";

const BAND_COLORS = {
  Beginner: "var(--color-success)",
  Intermediate: "var(--color-warning)",
  Advanced: "var(--color-primary-light)",
};

const SUBJECT_ICONS = {
  "terminal": Terminal,
  "bar-chart": BarChart2,
  "globe": Globe,
};

const renderSubjectIcon = (iconName, size = 32) => {
  const IconComp = SUBJECT_ICONS[iconName] || BookOpen;
  return <IconComp size={size} />;
};

const AssessmentPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [phase, setPhase] = useState("select"); // select | quiz | results
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pastResults, setPastResults] = useState([]);

  useEffect(() => {
    assessmentService.getSubjects().then(r => setSubjects(r.data)).catch(() => {});
    assessmentService.getResults().then(r => setPastResults(r.data)).catch(() => {});
  }, []);

  const startAssessment = async (subject) => {
    setLoading(true);
    try {
      const res = await assessmentService.start(subject.id);
      setSelectedSubject(subject);
      setQuestions(res.data.questions);
      setAnswers({});
      setCurrentQ(0);
      setPhase("quiz");
    } catch {
      toast.error("Failed to load assessment questions.");
    } finally {
      setLoading(false);
    }
  };

  const submitAssessment = async () => {
    setLoading(true);
    try {
      const res = await assessmentService.submit({
        subject_id: selectedSubject.id,
        answers: answers,
      });
      setResults(res.data);
      setPhase("results");
      toast.success("Assessment submitted!");
    } catch {
      toast.error("Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  const q = questions[currentQ];
  const answered = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answered / questions.length) * 100 : 0;

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ClipboardCheck size={28} color="var(--color-primary)" /> Assessment
        </h1>
        <p style={{ color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
          Identify your strengths and learning gaps
        </p>
      </div>

      <div className="page-body">
        {/* SELECT PHASE */}
        {phase === "select" && (
          <>
            {pastResults.length > 0 && (
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontWeight: 700, marginBottom: "1rem", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <History size={18} color="var(--color-accent)" /> Previous Results
                </h2>
                <div className="grid-3">
                  {pastResults.slice(0, 3).map(r => (
                    <div key={r.id} className="card" style={{ padding: "1.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <span style={{ fontWeight: 700, fontSize: "1.8rem" }}>{r.score}%</span>
                        <span className="badge" style={{
                          background: `${BAND_COLORS[r.skill_band] || "var(--color-primary)"}22`,
                          color: BAND_COLORS[r.skill_band] || "var(--color-primary)",
                        }}>{r.skill_band}</span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                        {new Date(r.taken_at).toLocaleDateString()}
                      </div>
                      {r.weak_topics.length > 0 && (
                        <div style={{ fontSize: "0.78rem", color: "var(--color-danger)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <AlertTriangle size={12} /> Weak: {r.weak_topics.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 style={{ fontWeight: 700, marginBottom: "1rem", fontSize: "1.1rem" }}>Choose a Subject to Assess</h2>
            <div className="grid-3">
              {subjects.map(subject => (
                <button
                  key={subject.id}
                  className="card"
                  style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--color-border)", background: "none" }}
                  onClick={() => startAssessment(subject)}
                  disabled={loading}
                >
                  <div style={{ marginBottom: "0.75rem", display: "inline-flex" }}>
                    {renderSubjectIcon(subject.icon, 36)}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>{subject.name}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", marginBottom: "0.75rem" }}>{subject.description}</div>
                  <span className="badge badge-accent">{subject.category}</span>
                </button>
              ))}
              {subjects.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                  No subjects available yet. Please seed the database first.
                </div>
              )}
            </div>
          </>
        )}

        {/* QUIZ PHASE */}
        {phase === "quiz" && q && (
          <div className="animate-fade-up" style={{ maxWidth: 700, margin: "0 auto" }}>
            {/* Progress */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                  Question {currentQ + 1} of {questions.length}
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  {answered} answered
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Subject badge */}
            <div style={{ marginBottom: "1rem" }}>
              <span className="badge badge-primary">{selectedSubject?.name}</span>
            </div>

            {/* Question */}
            <div className="card" style={{ marginBottom: "1.25rem", padding: "1.75rem" }}>
              <p style={{ fontSize: "1.1rem", fontWeight: 600, lineHeight: 1.6 }}>{q.question_text}</p>
            </div>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {(q.options || []).map((option, oi) => {
                const letter = String.fromCharCode(65 + oi); // A, B, C, D
                const selected = answers[q.id] === letter;
                return (
                  <button
                    key={oi}
                    onClick={() => setAnswers(a => ({ ...a, [q.id]: letter }))}
                    style={{
                      padding: "1rem 1.25rem",
                      borderRadius: "var(--radius-md)",
                      border: `1px solid ${selected ? "var(--color-primary)" : "var(--color-border)"}`,
                      background: selected ? "rgba(99,102,241,0.1)" : "var(--color-bg-card)",
                      color: selected ? "var(--color-primary-light)" : "var(--color-text-primary)",
                      cursor: "pointer", textAlign: "left", fontSize: "0.95rem",
                      fontWeight: selected ? 600 : 400,
                      transition: "all 0.2s ease",
                      display: "flex", alignItems: "center", gap: "0.875rem",
                    }}
                  >
                    <span style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: selected ? "var(--color-primary)" : "var(--color-bg-elevated)",
                      color: selected ? "#fff" : "var(--color-text-secondary)",
                      fontWeight: 700, fontSize: "0.8rem",
                    }}>{letter}</span>
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button className="btn btn-ghost"
                onClick={() => setCurrentQ(c => Math.max(0, c - 1))} disabled={currentQ === 0}>
                ← Previous
              </button>
              {currentQ < questions.length - 1 ? (
                <button className="btn btn-primary"
                  onClick={() => setCurrentQ(c => c + 1)} disabled={!answers[q.id]}>
                  Next →
                </button>
              ) : (
                <button className="btn btn-primary" onClick={submitAssessment} disabled={loading || answered === 0}>
                  {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Submitting...</> : "Submit Assessment"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* RESULTS PHASE */}
        {phase === "results" && results && (
          <div className="animate-fade-up" style={{ maxWidth: 600, margin: "0 auto" }}>
            <div className="card" style={{ textAlign: "center", padding: "2.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                {results.score >= 70 ? (
                  <Trophy size={64} color="var(--color-warning)" />
                ) : results.score >= 50 ? (
                  <Award size={64} color="var(--color-success)" />
                ) : (
                  <BookOpen size={64} color="var(--color-primary-light)" />
                )}
              </div>
              <h2 style={{ fontSize: "3rem", fontWeight: 900, marginBottom: "0.25rem" }}>
                <span className="gradient-text">{results.score}%</span>
              </h2>
              <p style={{ color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
                {results.correct} of {results.total} correct
              </p>
              <span className="badge" style={{
                fontSize: "0.9rem", padding: "0.4rem 1.25rem",
                background: `${BAND_COLORS[results.skill_band]}22`,
                color: BAND_COLORS[results.skill_band],
              }}>{results.skill_band}</span>
            </div>

            <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--color-success)", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <CheckCircle size={14} /> Strong Topics
                </div>
                {results.strong_topics.length > 0 ? results.strong_topics.map(t => (
                  <div key={t} style={{ fontSize: "0.85rem", padding: "0.25rem 0", color: "var(--color-text-secondary)" }}>• {t}</div>
                )) : <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>None identified</div>}
              </div>
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--color-danger)", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <XCircle size={14} /> Needs Improvement
                </div>
                {results.weak_topics.length > 0 ? results.weak_topics.map(t => (
                  <div key={t} style={{ fontSize: "0.85rem", padding: "0.25rem 0", color: "var(--color-text-secondary)" }}>• {t}</div>
                )) : <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>None! Great job.</div>}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setPhase("select")}>
                Take Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentPage;
