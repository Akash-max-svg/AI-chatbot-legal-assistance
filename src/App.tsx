import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import ChatbotPage from "./pages/ChatbotPage";
import SearchPage from "./pages/SearchPage";
import SummarizerPage from "./pages/SummarizerPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import VoiceAssistantPage from "./pages/VoiceAssistantPage";
import ArchitecturePage from "./pages/ArchitecturePage";
import EvaluationMetricsPage from "./pages/EvaluationMetricsPage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import CaseFilingPage from "./pages/CaseFilingPage";
import DocumentGeneratorPage from "./pages/DocumentGeneratorPage";
import LegalResearchPage from "./pages/LegalResearchPage";
// New pages
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import HelpPage from "./pages/HelpPage";
import MyCasesPage from "./pages/MyCasesPage";
import LawyerCasesPage from "./pages/LawyerCasesPage";
import JudgeCasesPage from "./pages/JudgeCasesPage";
// Judge-specific pages
import AssignedCasesPage from "./pages/AssignedCasesPage";
import PendingJudgmentsPage from "./pages/PendingJudgmentsPage";
import AIJudgmentSummariesPage from "./pages/AIJudgmentSummariesPage";
import VideoConferencePage from "./pages/VideoConferencePage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="architecture" element={<ArchitecturePage />} />

        {/* Protected — common */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="chatbot"
          element={
            <ProtectedRoute>
              <ChatbotPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="search"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="summarizer"
          element={
            <ProtectedRoute>
              <SummarizerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="knowledge"
          element={
            <ProtectedRoute>
              <KnowledgeBasePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="voice"
          element={
            <ProtectedRoute>
              <VoiceAssistantPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="research"
          element={
            <ProtectedRoute>
              <LegalResearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="evaluation-metrics"
          element={
            <ProtectedRoute>
              <EvaluationMetricsPage />
            </ProtectedRoute>
          }
        />

        {/* Citizen + Lawyer only */}
        <Route
          path="case-filing"
          element={
            <ProtectedRoute>
              <CaseFilingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="documents"
          element={
            <ProtectedRoute>
              <DocumentGeneratorPage />
            </ProtectedRoute>
          }
        />

        {/* My Cases — role-routed */}
        <Route
          path="my-cases"
          element={
            <ProtectedRoute>
              <MyCasesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="lawyer/cases"
          element={
            <ProtectedRoute>
              <LawyerCasesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="judge/cases"
          element={
            <ProtectedRoute>
              <JudgeCasesPage />
            </ProtectedRoute>
          }
        />

        {/* Judge-specific */}
        <Route
          path="judge/assigned-cases"
          element={
            <ProtectedRoute>
              <AssignedCasesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="judge/pending"
          element={
            <ProtectedRoute>
              <PendingJudgmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="judge/ai-summaries"
          element={
            <ProtectedRoute>
              <AIJudgmentSummariesPage />
            </ProtectedRoute>
          }
        />

        {/* Utility pages */}
        <Route
          path="notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="meetings"
          element={
            <ProtectedRoute>
              <VideoConferencePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="help" element={<HelpPage />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
