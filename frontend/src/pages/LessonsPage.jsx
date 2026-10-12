import { useState, useEffect, useRef } from "react";
import { assessmentService, lessonsService } from "../services";
import toast from "react-hot-toast";
import {
  CheckCircle,
  RefreshCw,
  Pin,
  Clock,
  PenTool,
  GraduationCap,
  Lightbulb,
  Trophy,
  ThumbsUp,
  AlertTriangle,
  Terminal,
  BarChart2,
  Globe,
  BookOpen,
} from "lucide-react";

const STATUS_ICONS = {
  completed: CheckCircle,
  in_progress: RefreshCw,
  not_started: Pin,
};

const STATUS_COLORS = {
  completed: "var(--color-success)",
  in_progress: "var(--color-warning)",
  not_started: "var(--color-text-muted)",
};

const SUBJECT_ICONS = {
  "terminal": Terminal,
  "bar-chart": BarChart2,
  "globe": Globe,
};

const renderSubjectIcon = (iconName, size = 24) => {
  const IconComp = SUBJECT_ICONS[iconName] || BookOpen;
  return <IconComp size={size} />;
};

const LessonsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  // Lesson Viewer states
  const [activeLesson, setActiveLesson] = useState(null);
  const [studyTime, setStudyTime] = useState(0);
  const [distractions, setDistractions] = useState(0);
  
  // Quiz states
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  const timerRef = useRef(null);
  const activeLessonRef = useRef(null);

  // Load subjects
  useEffect(() => {
    assessmentService.getSubjects()
      .then((r) => {
        setSubjects(r.data);
        if (r.data.length) setSelectedSubject(r.data[0]);
      })
      .catch(() => toast.error("Failed to load subjects."))
      .finally(() => setLoading(false));
  }, []);

  // Load lessons when selected subject changes or lesson updates
  const loadLessons = (subjId) => {
    setLessonsLoading(true);
    lessonsService.getBySubject(subjId)
      .then((r) => setLessons(r.data))
      .catch(() => toast.error("Failed to load lessons."))
      .finally(() => setLessonsLoading(false));
  };

  useEffect(() => {
    if (selectedSubject) {
      loadLessons(selectedSubject.id);
    }
  }, [selectedSubject]);

  // Keep ref updated for the event listener
  useEffect(() => {
    activeLessonRef.current = activeLesson;
  }, [activeLesson]);

  // Tab switching visibility tracking listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && activeLessonRef.current) {
        const lesson = activeLessonRef.current;
        setDistractions((d) => d + 1);
        
        // Report to backend
        lessonsService.distract(lesson.id)
          .then(() => {
            toast.error("Stay focused! Distraction event logged.", {
              duration: 3000,
            });
          })
          .catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Handle lesson timer
  useEffect(() => {
    if (activeLesson) {
      setStudyTime(0);
      setDistractions(activeLesson.progress?.distraction_events || 0);
      timerRef.current = setInterval(() => {
        setStudyTime((t) => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeLesson]);

  const handleStartLesson = async (lesson) => {
    try {
      await lessonsService.start(lesson.id);
      setActiveLesson(lesson);
      setActiveQuiz(null);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizResult(null);
      toast.success(`Started studying: ${lesson.title}`);
    } catch {
      toast.error("Failed to start study session.");
    }
  };

  const handleCompleteLesson = async () => {
    if (!activeLesson) return;
    try {
      await lessonsService.complete(activeLesson.id, { time_spent: studyTime });
      toast.success("Congratulations! Lesson marked as completed.");
      setActiveLesson(null);
      loadLessons(selectedSubject.id);
    } catch {
      toast.error("Failed to complete lesson.");
    }
  };

  const handleOpenQuiz = async () => {
    if (!activeLesson) return;
    try {
      const res = await lessonsService.getQuiz(activeLesson.id);
      setActiveQuiz(res.data);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizResult(null);
    } catch {
      toast.error("No quiz found or failed to load quiz.");
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeLesson || !activeQuiz) return;
    try {
      const res = await lessonsService.submitQuiz(activeLesson.id, {
        answers: quizAnswers,
        time_taken: studyTime,
      });
      setQuizResult(res.data);
      setQuizSubmitted(true);
      toast.success(`Quiz submitted! Score: ${res.data.score}%`);
      loadLessons(selectedSubject.id);
    } catch {
      toast.error("Failed to submit quiz.");
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>📚 Lessons</h1>
        <p style={{ color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
          Interactive study and real-time distraction tracking
        </p>
      </div>

      <div className="page-body">
        {/* Subject Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedSubject(s);
                setActiveLesson(null);
              }}
              className={`btn ${selectedSubject?.id === s.id ? "btn-primary" : "btn-ghost"}`}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              {renderSubjectIcon(s.icon, 16)} {s.name}
            </button>
          ))}
        </div>

        {activeLesson ? (
          /* ACTIVE STUDY MODE PANE */
          <div className="animate-fade-up grid-2">
            {/* Left Pane: Content */}
            <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: "500px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <span className="badge badge-accent">STUDYING</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setActiveLesson(null)}>
                  ✕ Close Lesson
                </button>
              </div>
              <h2 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: "0.5rem" }}>
                {activeLesson.title}
              </h2>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
                Difficulty: {activeLesson.difficulty} | Est: {activeLesson.estimated_minutes} min
              </div>

              <div
                style={{
                  flex: 1,
                  background: "var(--color-bg-base)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.5rem",
                  overflowY: "auto",
                  lineHeight: "1.7",
                  fontSize: "0.95rem",
                  color: "var(--color-text-primary)",
                  whiteSpace: "pre-wrap",
                  border: "1px solid var(--color-border)",
                  marginBottom: "1.5rem",
                  maxHeight: "350px",
                }}
              >
                {activeLesson.content || "No content loaded for this lesson. Read materials and click Take Quiz to test your knowledge."}
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                {activeLesson.has_quiz && (
                  <button className="btn btn-secondary" onClick={handleOpenQuiz} style={{ flex: 1, justifyContent: "center", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <PenTool size={16} /> Take Lesson Quiz
                  </button>
                )}
                <button className="btn btn-primary" onClick={handleCompleteLesson} style={{ flex: 1, justifyContent: "center", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <GraduationCap size={16} /> Mark Completed
                </button>
              </div>
            </div>

            {/* Right Pane: Real-Time Tracker & Quiz */}
            <div className="card" style={{ display: "flex", flexDirection: "column" }}>
              {!activeQuiz ? (
                /* Stats display */
                <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
                  <div style={{ display: "inline-flex", animation: "pulse-glow 2s infinite", marginBottom: "1.5rem" }}>
                    <Clock size={56} color="var(--color-primary)" />
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: "1.5rem" }}>Active Study Tracker</h3>
                  
                  <div className="grid-2" style={{ marginBottom: "2rem" }}>
                    <div style={{ background: "var(--color-bg-elevated)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
                      <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-primary-light)" }}>
                        {formatTime(studyTime)}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>Study Duration</div>
                    </div>
                    <div style={{
                      background: distractions > 0 ? "rgba(239, 68, 68, 0.08)" : "var(--color-bg-elevated)",
                      padding: "1.25rem",
                      borderRadius: "var(--radius-md)",
                      border: distractions > 0 ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid transparent",
                      transition: "all 0.3s ease"
                    }}>
                      <div style={{ fontSize: "2rem", fontWeight: 800, color: distractions > 0 ? "var(--color-danger)" : "var(--color-text-secondary)" }}>
                        {distractions}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>Distraction Events</div>
                    </div>
                  </div>

                  <div style={{ background: "rgba(99, 102, 241, 0.06)", border: "1px solid rgba(99, 102, 241, 0.15)", borderRadius: "var(--radius-md)", padding: "1.25rem", textAlign: "left" }}>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                      <Lightbulb size={16} color="var(--color-primary-light)" />
                      <strong style={{ fontSize: "0.85rem", color: "var(--color-text-primary)" }}>Visibility Tracking</strong>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
                      We track tab switches to log focus events. Switch browser tabs or minimize this window to log focus metrics for the prediction model!
                    </p>
                  </div>
                </div>
              ) : (
                /* Quiz Form */
                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <span className="badge badge-primary">{activeQuiz.title}</span>
                    {!quizSubmitted && <button className="btn btn-ghost btn-sm" onClick={() => setActiveQuiz(null)}>Cancel</button>}
                  </div>

                  {!quizSubmitted ? (
                    <div style={{ flex: 1, overflowY: "auto", maxHeight: "350px", paddingRight: "0.5rem" }}>
                      {activeQuiz.questions.map((question, qi) => (
                        <div key={question.id} style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem" }}>
                          <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.75rem" }}>
                            {qi + 1}. {question.question_text}
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {question.options.map((option, oi) => {
                              const letter = String.fromCharCode(65 + oi);
                              const selected = quizAnswers[question.id] === letter;
                              return (
                                <button
                                  key={oi}
                                  type="button"
                                  onClick={() => setQuizAnswers(a => ({ ...a, [question.id]: letter }))}
                                  style={{
                                    textAlign: "left", padding: "0.6rem 1rem", borderRadius: "var(--radius-sm)",
                                    border: `1px solid ${selected ? "var(--color-primary)" : "var(--color-border)"}`,
                                    background: selected ? "rgba(99,102,241,0.08)" : "var(--color-bg-card)",
                                    fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s"
                                  }}
                                >
                                  <strong>{letter}.</strong> {option}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <button className="btn btn-primary" onClick={handleSubmitQuiz} style={{ width: "100%", justifyContent: "center" }}
                        disabled={Object.keys(quizAnswers).length < activeQuiz.questions.length}>
                        Submit Quiz Answers
                      </button>
                    </div>
                  ) : (
                    /* Quiz Results Output */
                    <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                        {quizResult.score >= 70 ? (
                          <Trophy size={56} color="var(--color-warning)" />
                        ) : (
                          <ThumbsUp size={56} color="var(--color-success)" />
                        )}
                      </div>
                      <h3 style={{ fontWeight: 800, fontSize: "2rem" }}>
                        <span className="gradient-text">{quizResult.score}%</span>
                      </h3>
                      <p style={{ color: "var(--color-text-secondary)", marginTop: "0.5rem", marginBottom: "2rem" }}>
                        You got {quizResult.correct} of {quizResult.total} questions correct!
                      </p>
                      
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => {
                          setQuizAnswers({});
                          setQuizSubmitted(false);
                          setQuizResult(null);
                        }}>
                          Retry Quiz
                        </button>
                        <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setActiveQuiz(null)}>
                          Back to Study
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* LESSONS LIST VIEW */
          <div>
            {selectedSubject && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                  <span style={{ display: "inline-flex" }}>
                    {renderSubjectIcon(selectedSubject.icon, 32)}
                  </span>
                  <div>
                    <h2 style={{ fontWeight: 700, fontSize: "1.25rem" }}>{selectedSubject.name} Lessons</h2>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                      {selectedSubject.description}
                    </p>
                  </div>
                </div>

                {lessonsLoading ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <div className="spinner" />
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {lessons.map((lesson, idx) => {
                      const status = lesson.progress?.status || "not_started";
                      const StatusIconComp = STATUS_ICONS[status] || Pin;
                      return (
                        <div
                          key={lesson.id}
                          className="card"
                          style={{ display: "flex", alignItems: "center", gap: "1.25rem", padding: "1.25rem 1.5rem" }}
                        >
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: "var(--radius-md)",
                              background: "var(--gradient-primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "1rem",
                              flexShrink: 0,
                            }}
                          >
                            {idx + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{lesson.title}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", display: "flex", gap: "1rem" }}>
                              <span>Difficulty: {lesson.difficulty}</span>
                              <span>⏱️ ~{lesson.estimated_minutes} min</span>
                              {lesson.best_score !== undefined && lesson.best_score !== null && (
                                <span style={{ color: "var(--color-accent-light)", fontWeight: 600 }}>Best Score: {lesson.best_score}%</span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <span
                              className="badge"
                              style={{
                                background: `${STATUS_COLORS[status]}22`,
                                color: STATUS_COLORS[status],
                                fontSize: "0.75rem",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                              }}
                            >
                              <StatusIconComp size={12} />
                              {status.replace("_", " ")}
                            </span>

                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleStartLesson(lesson)}
                            >
                              {status === "completed"
                                ? "Review →"
                                : status === "in_progress"
                                ? "Resume →"
                                : "Start →"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {lessons.length === 0 && (
                      <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                        No lessons found for this subject.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonsPage;
