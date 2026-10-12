import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { profileService } from "../services";
import toast from "react-hot-toast";
import { User } from "lucide-react";

const SUBJECTS = ["Python", "Data Science", "Web Development", "Machine Learning", "JavaScript", "SQL", "Java", "C++"];
const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const EDUCATION_LEVELS = ["High School", "Undergraduate", "Graduate", "Professional", "Self-taught"];

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    education_level: user?.education_level || "",
    skill_level: user?.profile?.skill_level || "Beginner",
    subjects_of_interest: user?.profile?.subjects_of_interest || [],
    learning_goal: user?.profile?.learning_goal || "",
  });
  const [loading, setLoading] = useState(false);

  const toggleSubject = (s) => setForm(f => ({
    ...f,
    subjects_of_interest: f.subjects_of_interest.includes(s)
      ? f.subjects_of_interest.filter(x => x !== s)
      : [...f.subjects_of_interest, s],
  }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await profileService.update(form);
      updateUser(res.data);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <User size={28} color="var(--color-primary)" /> Profile
        </h1>
        <p style={{ color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
          Manage your learning profile and preferences
        </p>
      </div>
      <div className="page-body">
        <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Avatar card */}
          <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "var(--gradient-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.75rem", fontWeight: 700, flexShrink: 0,
              boxShadow: "var(--shadow-glow)",
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{user?.name}</div>
              <div style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>{user?.email}</div>
              <span className="badge badge-primary" style={{ marginTop: "0.4rem" }}>
                {user?.profile?.skill_level || "Beginner"}
              </span>
            </div>
          </div>

          {/* Basic Info */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: "1.25rem" }}>Basic Information</h3>
            <div className="form-group">
              <label className="input-label" htmlFor="profile-name">Full Name</label>
              <input id="profile-name" type="text" className="input" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="profile-edu">Education Level</label>
              <select id="profile-edu" className="input" value={form.education_level}
                onChange={e => setForm(f => ({ ...f, education_level: e.target.value }))} style={{ cursor: "pointer" }}>
                <option value="">Select level</option>
                {EDUCATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Learning Profile */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: "1.25rem" }}>Learning Profile</h3>
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
              <label className="input-label">Subjects of Interest</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {SUBJECTS.map(s => (
                  <button key={s} type="button" onClick={() => toggleSubject(s)} style={{
                    padding: "0.4rem 0.875rem", borderRadius: "var(--radius-full)",
                    cursor: "pointer", border: "1px solid",
                    borderColor: form.subjects_of_interest.includes(s) ? "var(--color-primary)" : "var(--color-border)",
                    background: form.subjects_of_interest.includes(s) ? "rgba(99,102,241,0.15)" : "transparent",
                    color: form.subjects_of_interest.includes(s) ? "var(--color-primary-light)" : "var(--color-text-secondary)",
                    fontSize: "0.85rem", fontWeight: 500, transition: "all 0.2s ease",
                  }}>{s}</button>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="profile-goal">Learning Goal</label>
              <textarea id="profile-goal" className="input" rows={3}
                placeholder="Describe what you want to achieve..."
                value={form.learning_goal}
                onChange={e => setForm(f => ({ ...f, learning_goal: e.target.value }))}
                style={{ resize: "vertical", minHeight: 80 }} />
            </div>
          </div>

          <button id="profile-save" className="btn btn-primary" onClick={handleSave} disabled={loading}
            style={{ alignSelf: "flex-start", padding: "0.875rem 2rem" }}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving...</> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
