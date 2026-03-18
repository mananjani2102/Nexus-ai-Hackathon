const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

async function extractText(file) {
  const mime = file.mimetype;
  if (mime === 'application/pdf') {
    const parsed = await pdfParse(file.buffer);
    return parsed.text;
  } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }
  return null;
}

// ─── POST /api/battle ───
router.post(
  '/battle',
  upload.fields([
    { name: 'resume1', maxCount: 1 },
    { name: 'resume2', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const file1 = req.files?.resume1?.[0];
      const file2 = req.files?.resume2?.[0];

      if (!file1 || !file2) {
        return res.status(400).json({ error: 'Two resume files are required.' });
      }

      const [resume1Text, resume2Text] = await Promise.all([
        extractText(file1),
        extractText(file2),
      ]);

      if (!resume1Text || resume1Text.trim().length < 30) {
        return res.status(400).json({ error: 'Could not extract text from Resume 1. Only PDF or DOCX are supported.' });
      }
      if (!resume2Text || resume2Text.trim().length < 30) {
        return res.status(400).json({ error: 'Could not extract text from Resume 2. Only PDF or DOCX are supported.' });
      }

      const { jobDescription = '' } = req.body;

      const prompt = `Compare these two resumes for this job description: ${jobDescription || 'General Software Engineering role'}

Resume 1:
${resume1Text.slice(0, 2000)}

Resume 2:
${resume2Text.slice(0, 2000)}

Return ONLY a valid JSON object (no markdown):
{
  "winner": 1 or 2,
  "resume1": {
    "score": number 0-100,
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2"],
    "verdict": "one sentence summary of this resume"
  },
  "resume2": {
    "score": number 0-100,
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2"],
    "verdict": "one sentence summary of this resume"
  },
  "battle_reason": "2 sentences explaining why the winner beats the loser",
  "keyword_edge": ["keyword1", "keyword2"],
  "margin": "Close Fight" or "Clear Win" or "Landslide"
}

Be fair, objective, and base scores on ATS readiness, keyword match, quantified achievements, and clarity.`;

      const OpenAI = require('openai');
      const openai = new OpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: process.env.GROQ_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content);
      res.json(result);
    } catch (err) {
      console.error('Battle error:', err.message);
      res.status(500).json({ error: err.message || 'Failed to compare resumes' });
    }
  },
);

module.exports = router;
