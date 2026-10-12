import { useState, useEffect } from "react";
import { dashboardService, recommendationsService } from "../services";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Target,
  Clock,
  Trophy,
  TrendingUp,
  BarChart2,
  Award,
  Rocket,
  CheckCircle,
} from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "0.75rem 1rem" }}>
      <p style={{ color: "var(--color-text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 700 }}>{p.value}{p.name === "score" ? "%" : ""}</p>
      ))}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="stat-card animate-fade-up">
    <div className="stat-icon" style={{ background: `${color}22` }}>
      <Icon size={24} color={color} />
    </div>
    <div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const BADGE_ICONS = {
  "target": Target,
  "rocket": Rocket,
  "book-open": BookOpen,
  "check-circle": CheckCircle,
  "trophy": Trophy,
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [quizPerf, setQuizPerf] = useState([]);
  const [mastery, setMastery] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, w, q, m, a, p] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getWeeklyProgress(),
          dashboardService.getQuizPerformance(),
          dashboardService.getTopicMastery(),
          dashboardService.getAchievements(),
          recommendationsService.getPerformancePrediction(),
        ]);
        setStats(s.data); setWeekly(w.data); setQuizPerf(q.data);
        setMastery(m.data); setAchievements(a.data.badges); setPrediction(p.data);
      } catch {
        // data might be empty for new user
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const predictionColor = {
    "High Success": "var(--color-success)",
    "Moderate Success": "var(--color-warning)",
    "At-Risk": "var(--color-danger)",
  };

  const getBadgeIcon = (iconName) => {
    const IconComp = BADGE_ICONS[iconName] || Award;
    return <IconComp size={24} color="var(--color-warning)" />;
  };

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>
          Welcome back, <span className="gradient-text">{user?.name?.split(" ")[0]}</span>
        </h1>
        <p style={{ color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
          Here's your learning progress overview
        </p>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: "3rem" }}>
            <div className="spinner" style={{ width: 40, height: 40 }} />
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid-4" style={{ marginBottom: "2rem" }}>
              <StatCard icon={BookOpen} label="Lessons Completed" value={stats?.completed_lessons ?? 0}
                sub={`${stats?.completion_rate ?? 0}% completion`} color="var(--color-primary-light)" />
              <StatCard icon={Target} label="Avg Quiz Score" value={`${stats?.avg_quiz_score ?? 0}%`}
                sub={`${stats?.total_quiz_attempts ?? 0} attempts`} color="var(--color-accent-light)" />
              <StatCard icon={Clock} label="Learning Hours" value={stats?.total_learning_hours ?? 0}
                sub="Total time invested" color="var(--color-success)" />
              <StatCard icon={Trophy} label="Achievements" value={achievements.length}
                sub="Badges earned" color="var(--color-warning)" />
            </div>

            {/* Performance Prediction */}
            {prediction && (
              <div className="card animate-fade-up" style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.4rem" }}>AI PERFORMANCE PREDICTION</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: predictionColor[prediction.prediction] }}>
                    {prediction.prediction}
                  </div>
                  {prediction.confidence_percent && (
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                      {prediction.confidence_percent}% confidence
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                  {Object.entries(prediction.features || {}).map(([k, v]) => (
                    <div key={k} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{typeof v === "number" ? v.toLocaleString() : v}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{k.replace(/_/g, " ")}</div>
                    </div>
                  ))}
                </div>
                <Link to="/learning-path" className="btn btn-primary btn-sm">View Path →</Link>
              </div>
            )}

            {/* Charts Row */}
            <div className="grid-2" style={{ marginBottom: "2rem" }}>
              {/* Weekly Progress */}
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <TrendingUp size={18} color="var(--color-primary)" /> Weekly Progress
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weekly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }}
                      tickFormatter={d => new Date(d).toLocaleDateString("en", { weekday: "short" })} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="lessons_completed" stroke="#6366f1" strokeWidth={2.5}
                      dot={{ fill: "#6366f1", r: 4 }} activeDot={{ r: 6 }} name="lessons" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Quiz Performance */}
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <BarChart2 size={18} color="var(--color-accent)" /> Quiz Scores
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={quizPerf}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="attempted_at" tick={{ fill: "#94a3b8", fontSize: 10 }}
                      tickFormatter={d => new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" })} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="score" fill="url(#colorScore)" radius={[4, 4, 0, 0]} name="score" />
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Topic Mastery + Achievements */}
            <div className="grid-2">
              {/* Radar Chart */}
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Target size={18} color="var(--color-primary)" /> Topic Mastery
                </h3>
                {mastery.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={mastery}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Radar dataKey="mastery_percent" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
                    <BookOpen size={40} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                    <p>Complete some lessons to see topic mastery</p>
                    <Link to="/lessons" className="btn btn-secondary btn-sm" style={{ marginTop: "1rem", display: "inline-flex" }}>
                      Browse Lessons
                    </Link>
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Trophy size={18} color="var(--color-warning)" /> Achievements
                </h3>
                {achievements.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {achievements.map(badge => (
                      <div key={badge.id} style={{
                        display: "flex", alignItems: "center", gap: "1rem",
                        padding: "0.75rem 1rem", borderRadius: "var(--radius-md)",
                        background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
                      }}>
                        <div style={{ flexShrink: 0 }}>{getBadgeIcon(badge.icon)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{badge.title}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{badge.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
                    <Award size={40} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                    <p>Complete lessons and quizzes to earn badges!</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
