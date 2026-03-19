const express  = require('express');
const multer   = require('multer');
const pdfParse = require('pdf-parse');
const mammoth  = require('mammoth');

const router  = express.Router();
const upload  = multer({ storage: multer.memoryStorage() });

router.post('/bulk-analyze', upload.array('resumes', 50), async (req, res) => {
  try {
    const { jobRole = 'Software Engineer' } = req.body;
    const files = req.files;

    if (!files || files.length < 2) {
      return res.status(400).json({ error: 'Please upload at least 2 resumes.' });
    }
    if (files.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 resumes allowed per batch.' });
    }

    // Extract text from each resume
    const resumeTexts = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let text = '';
      const mime = file.mimetype;

      try {
        if (mime === 'application/pdf') {
          const parsed = await pdfParse(file.buffer);
          text = parsed.text;
        } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          text = result.value;
        } else {
          text = '[Unsupported file format]';
        }
      } catch (extractErr) {
        console.error(`Error extracting text from ${file.originalname}:`, extractErr.message);
        text = '[Could not extract text]';
      }

      resumeTexts.push({
        index: i + 1,
        filename: file.originalname,
        text: text.slice(0, 1500),
      });
    }

    // Build the combined resume text block
    const resumeBlock = resumeTexts
      .map(r => `RESUME [${r.index}] — ${r.filename}:\n${r.text}\n---`)
      .join('\n\n');

    const prompt = `You are an expert ATS resume analyzer. Analyze these ${files.length} resumes for the role of ${jobRole}.

${resumeBlock}

Return ONLY a valid JSON object containing a "results" array. No markdown, no introductory text.
{
  "results": [
    {
      "filename": "original filename",
      "overall_score": number 0-100,
      "ats_score": number 0-100,
      "clarity_score": number 0-100,
      "strengths": ["strength 1", "strength 2", "strength 3"],
      "top_keyword_missing": "single most important missing keyword"
    }
  ]
}
Apply strict, objective, and deterministic scoring algorithms. If a document is clearly NOT a resume (e.g. rules, guidelines, policies, random letters), it MUST receive a score of 0 for all metrics. If two resumes have identical content, they MUST receive the exact same scores. Do not add arbitrary variance.`;

    let results;

    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        top_p: 0.8,
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0].message.content;

      try {
        const parsed = JSON.parse(raw);
        results = parsed.results || [];
      } catch {
        throw new Error('Failed to parse AI response as JSON');
      }
    } catch (aiErr) {
      console.error('AI analysis failed:', aiErr.message);
      throw new Error('AI Engine Error: ' + aiErr.message);
    }

    // Sort by overall_score descending and assign rank
    results.sort((a, b) => b.overall_score - a.overall_score);
    results = results.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    res.json({
      results,
      jobRole,
      totalAnalyzed: results.length,
    });
  } catch (err) {
    console.error('Recruiter bulk-analyze error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = router;
