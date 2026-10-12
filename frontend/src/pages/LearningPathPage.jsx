import { useState, useEffect } from "react";
import { learningPathService } from "../services";
import toast from "react-hot-toast";
import { Map, Sparkles, RefreshCw, Compass, Paperclip, ChevronDown } from "lucide-react";

const DIFFICULTY_COLORS = {
  Beginner: "var(--color-success)",
  Intermediate: "var(--color-warning)",
  Advanced: "var(--color-danger)",
};

const LearningPathPage = () => {
  const [pathData, setPathData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState(0);

  useEffect(() => {
    learningPathService.get()
      .then(res => setPathData(res.data.generated_path))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const generatePath = async () => {
    setGenerating(true);
    try {
      const res = await learningPathService.generate({});
      setPathData(res.data.generated_path);
      setExpandedPhase(0);
      toast.success("Your personalized learning path is ready!");
    } catch {
      toast.error("Failed to generate learning path. Check your Groq API key.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Map size={28} color="var(--color-primary)" /> Learning Path
          </h1>
          <p style={{ color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            Your AI-generated personalized roadmap
          </p>
        </div>
        <button className="btn btn-primary" onClick={generatePath} disabled={generating} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {generating ? (
            <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating...</>
          ) : pathData ? (
            <><RefreshCw size={14} /> Regenerate Path</>
          ) : (
            <><Sparkles size={14} /> Generate My Path</>
          )}
        </button>
      </div>

      <div className="page-body">
        {!pathData ? (
          <div className="animate-fade-up" style={{ textAlign: "center", paddingTop: "3rem" }}>
            <Map size={48} color="var(--color-primary-light)" style={{ margin: "0 auto 1.5rem" }} />
            <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No learning path yet</h2>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "2rem", maxWidth: 480, margin: "0 auto 2rem" }}>
              Generate your personalized AI learning path based on your skill level, goals, and assessment results.
            </p>
            <button className="btn btn-primary" onClick={generatePath} disabled={generating} style={{ fontSize: "1rem", padding: "0.875rem 2rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              {generating ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Generating with AI...</>
              ) : (
                <><Sparkles size={18} /> Generate My Learning Path</>
              )}
            </button>
          </div>
        ) : (
          <>
            {/* Path summary */}
            <div className="card animate-fade-up" style={{ marginBottom: "2rem", background: "var(--gradient-card)", border: "1px solid var(--color-border-active)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>
                    Your Goal
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{pathData.goal}</div>
                </div>
                <div style={{ display: "flex", gap: "2rem" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-primary-light)" }}>
                      {pathData.total_phases}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Phases</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-accent-light)" }}>
                      {pathData.estimated_weeks}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Est. Weeks</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-success)" }}>
                      {pathData.phases?.reduce((acc, p) => acc + (p.topics?.length || 0), 0) || 0}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Topics</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phases */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {pathData.phases?.map((phase, pi) => (
                <div key={pi} className="phase-card animate-fade-up" style={{ animationDelay: `${pi * 0.1}s` }}>
                  <div
                    className="phase-header"
                    style={{ cursor: "pointer" }}
                    onClick={() => setExpandedPhase(expandedPhase === pi ? -1 : pi)}
                  >
                    <div className="phase-number">{phase.phase_number}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "1rem" }}>{phase.phase_title}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginTop: "0.2rem" }}>
                        {phase.description}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
                      <span className="badge badge-accent">{phase.estimated_weeks}w</span>
                      <ChevronDown size={18} style={{ transform: expandedPhase === pi ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: "var(--color-text-muted)" }} />
                    </div>
                  </div>

                  {expandedPhase === pi && (
                    <div>
                      {phase.topics?.map((topic, ti) => (
                        <div key={ti} className="topic-item">
                          <div style={{
                            width: 8, height: 8, borderRadius: "50%", marginTop: "0.4rem", flexShrink: 0,
                            background: DIFFICULTY_COLORS[topic.difficulty] || "var(--color-primary)",
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{topic.title}</span>
                              <span className="badge" style={{
                                background: `${DIFFICULTY_COLORS[topic.difficulty]}22`,
                                color: DIFFICULTY_COLORS[topic.difficulty],
                                fontSize: "0.7rem",
                              }}>{topic.difficulty}</span>
                              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "auto" }}>
                                ~{topic.estimated_hours}h
                              </span>
                            </div>
                            <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{topic.description}</p>
                            {topic.resources?.length > 0 && (
                              <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                {topic.resources.map((r, ri) => (
                                  <span key={ri} style={{
                                    fontSize: "0.72rem", padding: "0.2rem 0.6rem",
                                    background: "rgba(6,182,212,0.1)", color: "var(--color-accent-light)",
                                    borderRadius: "var(--radius-full)", border: "1px solid rgba(6,182,212,0.2)",
                                    display: "inline-flex", alignItems: "center", gap: "0.25rem"
                                  }}>
                                    <Paperclip size={10} />
                                    {r}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LearningPathPage;
