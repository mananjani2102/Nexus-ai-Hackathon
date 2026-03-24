import React, { createContext, useContext, useState, useCallback } from "react";
const ResumeContext = createContext(null);
export const useResume = () => {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error("useResume must be used within ResumeProvider");
  return ctx;
};
export function ResumeProvider({ children }) {
  const [file, setFile] = useState(null);
  const [jobRole, setJobRole] = useState("Software Engineer");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [bulletResult, setBulletResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const clearError = useCallback(() => setError(null), []);
  const resetAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setBulletResult(null);
    setFile(null);
    setError(null);
  }, []);
  const value = {
    file,
    setFile,
    jobRole,
    setJobRole,
    analysisResult,
    setAnalysisResult,
    bulletResult,
    setBulletResult,
    history,
    setHistory,
    loading,
    setLoading,
    error,
    setError,
    clearError,
    resetAnalysis,
  };
  return (
    <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>
  );
}
