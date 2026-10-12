import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Brain } from "lucide-react";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--color-bg-base)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
    }}>
      {/* Background gradient orbs */}
      <div style={{
        position: "fixed", top: "10%", left: "15%",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "10%", right: "15%",
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="animate-fade-up" style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
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
            Welcome back
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Sign in to continue your learning journey
          </p>
        </div>

        {/* Form Card */}
        <div className="card" style={{ padding: "2rem" }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="input-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="input-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="Your password"
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem", padding: "0.875rem" }}
              disabled={loading}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</>
              ) : "Sign In →"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--color-primary-light)", fontWeight: 600, textDecoration: "none" }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
