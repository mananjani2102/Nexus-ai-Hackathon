const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
const authRoutes     = require('./routes/auth');
const analyzeRoutes  = require('./routes/analyze');
const bulletRoutes   = require('./routes/bullet');
const interviewRoutes= require('./routes/interview');
const rewriteRoutes  = require('./routes/rewrite');
const historyRoutes  = require('./routes/history');
const recruiterRoutes = require('./routes/recruiter');
const mockInterviewRoutes = require('./routes/mockInterview');
const voiceAssistantRoutes = require('./routes/voiceAssistant');
const battleRoutes = require('./routes/battle');

app.use('/api/auth',               authRoutes);
app.use('/api',                    analyzeRoutes);
app.use('/api',                    bulletRoutes);
app.use('/api',                    interviewRoutes);
app.use('/api',                    rewriteRoutes);
app.use('/api',                    historyRoutes);
app.use('/api/recruiter',          recruiterRoutes);
app.use('/api/mock-interview',     mockInterviewRoutes);
app.use('/api/voice-assistant',    voiceAssistantRoutes);
app.use('/api',                    battleRoutes);

// Health check
app.get('/', (req, res) => res.json({ status: 'Nexus AI Backend Running ✅' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// MongoDB connect + start
const PORT = process.env.PORT || 4000;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(' MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
