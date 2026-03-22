import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ResumeProvider } from "./context/ResumeContext";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import BrandIntro from "./components/BrandIntro";
import LandingPage from "./pages/LandingPage";
import UploadPage from "./pages/UploadPage";
import DashboardPage from "./pages/DashboardPage";
import SuggestionsPage from "./pages/SuggestionsPage";
import BulletImproverPage from "./pages/BulletImproverPage";
import HistoryPage from "./pages/HistoryPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RecruiterPage from "./pages/RecruiterPage";
import MockInterviewPage from "./pages/MockInterviewPage";
import VoiceAssistantPage from "./pages/VoiceAssistantPage";
import BattlePage from "./pages/BattlePage";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      {" "}
      <Routes location={location} key={location.pathname}>
        {" "}
        <Route path="/" element={<LandingPage />} />{" "}
        <Route path="/upload" element={<UploadPage />} />{" "}
        <Route path="/dashboard" element={<DashboardPage />} />{" "}
        <Route path="/suggestions" element={<SuggestionsPage />} />{" "}
        <Route path="/bullet" element={<BulletImproverPage />} />{" "}
        <Route path="/history" element={<HistoryPage />} />{" "}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/recruiter" element={<RecruiterPage />} />
        <Route path="/interview" element={<MockInterviewPage />} />
        <Route path="/voice-assistant" element={<VoiceAssistantPage />} />
        <Route path="/battle" element={<BattlePage />} />
      </Routes>{" "}
    </AnimatePresence>
  );
}
export default function App() {
  return (
    <AuthProvider>
      <ResumeProvider>
        {" "}
        <BrandIntro>
          {" "}
          <BrowserRouter>
            {" "}
            <Navbar /> <AnimatedRoutes />{" "}
          </BrowserRouter>{" "}
        </BrandIntro>{" "}
      </ResumeProvider>
    </AuthProvider>
  );
}
