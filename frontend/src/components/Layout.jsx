import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Brain, 
  BarChart3, 
  Map, 
  BookOpen, 
  ClipboardCheck, 
  Bot, 
  User as UserIcon, 
  LogOut 
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/dashboard",     label: "Dashboard",       icon: BarChart3 },
  { path: "/learning-path", label: "Learning Path",   icon: Map },
  { path: "/lessons",       label: "Lessons",         icon: BookOpen },
  { path: "/assessment",    label: "Assessment",      icon: ClipboardCheck },
  { path: "/chat",          label: "AI Tutor",        icon: Bot },
  { path: "/profile",       label: "Profile",         icon: UserIcon },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="page-container">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: "1.75rem 1.5rem 1.25rem", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "10px",
              background: "var(--gradient-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Brain size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.01em" }}>Pathwise</div>
              <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Personalized Learning</div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "var(--gradient-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: "0.9rem", flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontWeight: 600, fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.name}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                {user?.profile?.skill_level || "Beginner"}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "1rem 0.75rem" }}>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.7rem 0.875rem",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "0.25rem",
                  textDecoration: "none",
                  fontWeight: active ? 600 : 500,
                  fontSize: "0.9rem",
                  color: active ? "var(--color-primary-light)" : "var(--color-text-secondary)",
                  background: active ? "rgba(99, 102, 241, 0.12)" : "transparent",
                  border: active ? "1px solid rgba(99, 102, 241, 0.2)" : "1px solid transparent",
                  transition: "all 0.2s ease",
                }}
              >
                <Icon size={18} style={{ opacity: active ? 1 : 0.8 }} />
                {item.label}
                {active && (
                  <div style={{
                    marginLeft: "auto",
                    width: 6, height: 6, borderRadius: "50%",
                    background: "var(--color-primary)",
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--color-border)" }}>
          <button
            onClick={logout}
            className="btn btn-ghost"
            style={{ width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
