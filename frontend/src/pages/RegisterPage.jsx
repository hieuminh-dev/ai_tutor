import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Brain } from "lucide-react";

const SUBJECTS = ["Python", "Data Science", "Web Development", "Machine Learning", "JavaScript", "SQL", "Java", "C++"];
const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const EDUCATION_LEVELS = ["High School", "Undergraduate", "Graduate", "Professional", "Self-taught"];

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    education_level: "", skill_level: "Beginner",
    subjects_of_interest: [], learning_goal: "",
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const toggleSubject = (subject) => {
    setForm(f => ({
      ...f,
      subjects_of_interest: f.subjects_of_interest.includes(subject)
        ? f.subjects_of_interest.filter(s => s !== subject)
        : [...f.subjects_of_interest, subject],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created! Let's start learning.");
      navigate("/assessment");
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--color-bg-base)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
    }}>
      <div style={{
        position: "fixed", top: "5%", right: "10%",
        width: 350, height: 350, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="animate-fade-up" style={{ width: "100%", maxWidth: 520 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 60, height: 60, borderRadius: "16px",
            background: "var(--gradient-primary)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--shadow-glow)",
            marginBottom: "1rem"
          }}>
            <Brain size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>
            Create your account
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Start your personalized AI learning journey
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", justifyContent: "center" }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, maxWidth: 120, height: 4, borderRadius: "2px",
              background: s <= step ? "var(--gradient-primary)" : "var(--color-bg-elevated)",
              transition: "background 0.3s ease",
            }} />
          ))}
        </div>

        <div className="card" style={{ padding: "2rem" }}>
          <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); setStep(2); }}>
            {step === 1 && (
              <>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem" }}>Basic Information</h2>
                <div className="form-group">
                  <label className="input-label" htmlFor="reg-name">Full Name *</label>
                  <input id="reg-name" type="text" className="input" placeholder="John Doe"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="input-label" htmlFor="reg-email">Email Address *</label>
                  <input id="reg-email" type="email" className="input" placeholder="you@example.com"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="input-label" htmlFor="reg-password">Password * (min. 6 chars)</label>
                  <input id="reg-password" type="password" className="input" placeholder="Create a strong password"
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="input-label" htmlFor="reg-edu">Education Level</label>
                  <select id="reg-edu" className="input"
                    value={form.education_level} onChange={e => setForm(f => ({ ...f, education_level: e.target.value }))}
                    style={{ cursor: "pointer" }}>
                    <option value="">Select level</option>
                    {EDUCATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem", padding: "0.875rem" }}>
                  Continue →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem" }}>Learning Profile</h2>
                <div className="form-group">
                  <label className="input-label">Skill Level</label>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    {SKILL_LEVELS.map(level => (
                      <button key={level} type="button"
                        onClick={() => setForm(f => ({ ...f, skill_level: level }))}
                        className={`btn ${form.skill_level === level ? "btn-primary" : "btn-ghost"}`}
                        style={{ flex: 1, justifyContent: "center" }}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="input-label">Subjects of Interest (pick any)</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {SUBJECTS.map(subject => (
                      <button key={subject} type="button"
                        onClick={() => toggleSubject(subject)}
                        style={{
                          padding: "0.4rem 0.875rem", borderRadius: "var(--radius-full)",
                          cursor: "pointer", border: "1px solid",
                          borderColor: form.subjects_of_interest.includes(subject) ? "var(--color-primary)" : "var(--color-border)",
                          background: form.subjects_of_interest.includes(subject) ? "rgba(99,102,241,0.15)" : "transparent",
                          color: form.subjects_of_interest.includes(subject) ? "var(--color-primary-light)" : "var(--color-text-secondary)",
                          fontSize: "0.85rem", fontWeight: 500, transition: "all 0.2s ease",
                        }}>
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="input-label" htmlFor="reg-goal">Learning Goal</label>
                  <textarea id="reg-goal" className="input" rows={3}
                    placeholder="e.g. Become a Python developer, learn data science for my job..."
                    value={form.learning_goal}
                    onChange={e => setForm(f => ({ ...f, learning_goal: e.target.value }))}
                    style={{ resize: "vertical", minHeight: 80 }} />
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                  <button id="register-submit" type="submit" className="btn btn-primary"
                    style={{ flex: 1, justifyContent: "center", padding: "0.875rem" }} disabled={loading}>
                    {loading ? (
                      <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating account...</>
                    ) : "Create Account"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--color-primary-light)", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
