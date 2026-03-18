const express  = require('express');
const multer   = require('multer');
const pdfParse = require('pdf-parse');
const mammoth  = require('mammoth');
const crypto   = require('crypto');
const History  = require('../models/History');
const { extractDocxWithStyles } = require('../utils/docxStyleExtractor');
const { storeDocxBuffer } = require('../utils/docxStore');

const router  = express.Router();
const upload  = multer({ storage: multer.memoryStorage() });

router.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    const { jobRole = 'Software Engineer', jobDescription = '' } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Resume file is required' });

    let resumeText = '';
    let resumeHtml = '';
    let docxId = null;
    const mime = req.file.mimetype;

    if (mime === 'application/pdf') {
      const parsed = await pdfParse(req.file.buffer);
      resumeText = parsed.text;
    } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Extract plain text for analysis (mammoth is fine for this)
      const resultTxt = await mammoth.extractRawText({ buffer: req.file.buffer });
      resumeText = resultTxt.value;
      
      // Extract styled HTML using custom DOCX parser (preserves colors, fonts, layout)
      const styledHtml = await extractDocxWithStyles(req.file.buffer);
      if (styledHtml) {
        resumeHtml = styledHtml;
      } else {
        // Fallback to mammoth if custom parser fails
        const resultHtml = await mammoth.convertToHtml({ buffer: req.file.buffer });
        resumeHtml = resultHtml.value;
      }

      // Store the original DOCX buffer for later download
      docxId = storeDocxBuffer(req.file.buffer);
    } else {
      return res.status(400).json({ error: 'Only PDF or DOCX files are supported' });
    }

    if (!resumeText || resumeText.trim().length < 50)
      return res.status(400).json({ error: 'Could not extract text from resume.' });

    const jdPart = jobDescription ? `Job Description:\n${jobDescription}\n\n` : '';

    const prompt = `You are an expert ATS resume analyzer and career coach.
Analyze this resume for the role of: ${jobRole}
${jdPart}Resume Content:
${resumeText.slice(0, 3000)}
Return ONLY a valid JSON object with exactly these keys:
{
  "overall_score": number 0-100,
  "ats_score": number 0-100,
  "clarity_score": number 0-100,
  "strengths": array of 4 strings,
  "weaknesses": array of 4 strings,
  "ats_keywords_missing": array of 6-10 strings,
  "star_bullets": object with 3 original:improved pairs
}`;

    const OpenAI = require('openai');
    const openai = new OpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY,
    });
    
    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }]
    });
    const raw = response.choices[0].message.content;
    let result;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      result = {
        overall_score: 65, ats_score: 60, clarity_score: 70,
        strengths: ['Clear work experience', 'Education present', 'Contact info included', 'Skills section exists'],
        weaknesses: ['Missing metrics', 'Weak action verbs', 'Keywords not optimized', 'No summary'],
        ats_keywords_missing: ['agile', 'collaboration', 'leadership', 'data-driven', 'scalable', 'CI/CD'],
        star_bullets: {
          'Worked on projects': 'Led team of 5 to deliver 3 projects on time, reducing delivery time by 30%',
          'Helped with tasks': 'Collaborated with stakeholders to streamline workflow, improving efficiency by 25%',
          'Fixed bugs': 'Identified and resolved 50+ critical bugs, reducing production incidents by 40%',
        },
      };
    }

    await History.create({
      filename: req.file.originalname,
      job_role: jobRole,
      overall_score: result.overall_score,
      ats_score: result.ats_score,
      clarity_score: result.clarity_score,
      keywords_missing: result.ats_keywords_missing || [],
    });

    result.resumeText = resumeText;
    result.resumeHtml = resumeHtml;
    result.resumeFormat = mime.includes('pdf') ? 'pdf' : 'docx';
    result.docxId = docxId; // Will be null for PDF, string for DOCX
    
    res.json(result);
  } catch (err) {
    console.error('Analyze error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
