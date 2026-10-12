import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import AssessmentPage from "./pages/AssessmentPage";
import LearningPathPage from "./pages/LearningPathPage";
import ChatPage from "./pages/ChatPage";
import LessonsPage from "./pages/LessonsPage";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-overlay">
      <div style={{ textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto 1rem" }} />
        <p style={{ color: "var(--color-text-secondary)" }}>Loading...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />

    <Route path="/login" element={
      <PublicRoute><LoginPage /></PublicRoute>
    } />
    <Route path="/register" element={
      <PublicRoute><RegisterPage /></PublicRoute>
    } />

    <Route path="/" element={
      <ProtectedRoute><Layout /></ProtectedRoute>
    }>
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="assessment" element={<AssessmentPage />} />
      <Route path="learning-path" element={<LearningPathPage />} />
      <Route path="chat" element={<ChatPage />} />
      <Route path="lessons" element={<LessonsPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

const App = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;
