import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.DEV 
    ? "http://localhost:4002/api" 
    : (import.meta.env.VITE_API_URL || "https://nexus-ai-3o4n.onrender.com/api"),
  timeout: 90000,
});

// Request interceptor: inject auth token if stored locally
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || localStorage.getItem("nexus_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: retry transient 429/503 errors with exponential backoff
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    config.__retryCount = config.__retryCount || 0;
    const isTransient = error.response && (error.response.status === 429 || error.response.status === 503);

    if (isTransient && config.__retryCount < 2) {
      config.__retryCount += 1;
      const retryAfter = parseInt(error.response?.headers?.["retry-after"], 10);
      const delay = !isNaN(retryAfter) && retryAfter > 0 
        ? retryAfter * 1000 
        : Math.pow(2, config.__retryCount) * 1000;

      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config);
    }

    const enhancedMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected network error occurred";
    error.userMessage = enhancedMessage;
    return Promise.reject(error);
  }
);
export const analyzeResume = async (file, jobRole, jdText) => {
  const formData = new FormData();
  formData.append("resume", file);
  formData.append("jobRole", jobRole);
  if (jdText) {
    formData.append("jobDescription", jdText);
  }
  // Let axios set multipart boundary — manual Content-Type breaks file uploads
  const { data } = await api.post("/analyze", formData);
  return data;
};
export const improveBullet = async (bullet, jobRole) => {
  const { data } = await api.post("/improve-bullet", { bullet, jobRole });
  return data;
};
export const getHistory = async () => {
  const { data } = await api.get("/history");
  return data;
};

export const generateInterviewQuestions = async (payload) => {
  const { data } = await api.post("/interview-questions", payload);
  return data;
};

export const rewriteResume = async (payload) => {
  const { data } = await api.post("/rewrite-resume", payload);
  return data;
};

export const bulkAnalyzeResumes = async (files, jobRole) => {
  const formData = new FormData();
  files.forEach(f => formData.append('resumes', f));
  formData.append('jobRole', jobRole);
  const { data } = await api.post('/recruiter/bulk-analyze', formData, {
    timeout: 180000,
  });
  return data;
};

export const generateMockQuestions = async (resumeText, jobRole) => {
  const { data } = await api.post("/mock-interview/questions", { resumeText, jobRole });
  return data;
};

export const evaluateInterview = async (jobRole, qa, speechStats) => {
  const { data } = await api.post("/mock-interview/evaluate", { jobRole, qa, speechStats }, { timeout: 120000 });
  return data;
};

/** Server-side STT (Groq Whisper). Pass a Blob from MediaRecorder (e.g. audio/webm). */
export const transcribeInterviewAudio = async (audioBlob, mimeType = "audio/webm") => {
  const ext = mimeType.includes("mp4") || mimeType.includes("m4a") ? "m4a" : "webm";
  const formData = new FormData();
  formData.append("audio", audioBlob, `recording.${ext}`);
  const { data } = await api.post("/mock-interview/transcribe", formData, {
    timeout: 120000,
  });
  return data;
};

export const chatWithVoiceAssistant = async (message, resumeText, jobRole, history) => {
  const { data } = await api.post('/voice-assistant/chat', {
    message,
    resumeText: resumeText || '',
    jobRole: jobRole || 'Software Engineer',
    history: history || [],
  });
  return data;
};

export const battleResumes = async (file1, file2, jobDescription) => {
  const formData = new FormData();
  formData.append('resume1', file1);
  formData.append('resume2', file2);
  formData.append('jobDescription', jobDescription || '');
  const { data } = await api.post('/battle', formData, { timeout: 60000 });
  return data;
};

export const generateCoverLetter = async ({
  resumeText,
  jobRole,
  companyName,
  jobDescription,
  tone = "professional",
}) => {
  const { data } = await api.post("/cover-letter", {
    resumeText,
    jobRole,
    companyName,
    jobDescription,
    tone,
  });
  return data;
};
