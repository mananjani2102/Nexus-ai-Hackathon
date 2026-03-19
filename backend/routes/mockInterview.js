const express = require('express');
const multer = require('multer');
const router = express.Router();

const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

function clampScore(n) {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

function wordCount(answer) {
  return String(answer || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/** At least this many words = "answered" for scoring (below = treat as skipped / no rating). */
const MIN_WORDS_FOR_SCORE = 8;

function hasSubstantiveAnswer(item) {
  return wordCount(item.answer) >= MIN_WORDS_FOR_SCORE;
}

/** Ensure one evaluation per question; never trust model scores for empty/skipped answers. */
function normalizeInterviewResult(raw, qa) {
  const n = qa.length;
  const evalsIn = Array.isArray(raw?.evaluations) ? raw.evaluations : [];

  const fallbackForIndex = (i, item) => {
    const answered = hasSubstantiveAnswer(item);
    const words = wordCount(item.answer);
    const content = answered ? clampScore(42 + Math.min(38, words)) : 0;
    const delivery = answered ? clampScore(item.confidenceScore || 60) : 0;
    const overall = answered ? clampScore(Math.round(content * 0.55 + delivery * 0.45)) : 0;
    return {
      id: i + 1,
      content_score: content,
      delivery_score: delivery,
      overall_score: overall,
      feedback: answered
        ? 'You shared enough detail to evaluate. Next time lead with a clear situation, your actions, and a measurable result.'
        : 'No answer was provided (or it was too short). This question scores 0 until you share at least a few real sentences.',
      ideal_answer:
        'A strong answer states the context, what you did (tools, decisions), and the outcome with one number or concrete detail.',
      keyword_hits: answered ? ['substance'] : [],
    };
  };

  const evaluations = qa.map((item, i) => {
    const ev = evalsIn[i] || {};
    const fb = fallbackForIndex(i, item);

    if (!hasSubstantiveAnswer(item)) {
      return {
        id: i + 1,
        content_score: 0,
        delivery_score: 0,
        overall_score: 0,
        feedback: fb.feedback,
        ideal_answer:
          typeof ev.ideal_answer === 'string' && ev.ideal_answer.trim().length > 15
            ? ev.ideal_answer.trim()
            : fb.ideal_answer,
        keyword_hits: [],
      };
    }

    return {
      id: i + 1,
      content_score: clampScore(ev.content_score ?? fb.content_score),
      delivery_score: clampScore(ev.delivery_score ?? fb.delivery_score),
      overall_score: clampScore(ev.overall_score ?? fb.overall_score),
      feedback:
        typeof ev.feedback === 'string' && ev.feedback.trim().length > 15 ? ev.feedback.trim() : fb.feedback,
      ideal_answer:
        typeof ev.ideal_answer === 'string' && ev.ideal_answer.trim().length > 15
          ? ev.ideal_answer.trim()
          : fb.ideal_answer,
      keyword_hits: Array.isArray(ev.keyword_hits)
        ? ev.keyword_hits.filter((k) => typeof k === 'string').slice(0, 12)
        : fb.keyword_hits,
    };
  });

  const answeredCount = qa.filter(hasSubstantiveAnswer).length;

  const avgFromEvals = evaluations.length
    ? Math.round(evaluations.reduce((s, e) => s + e.overall_score, 0) / evaluations.length)
    : 0;

  const overall_score = answeredCount === 0 ? 0 : avgFromEvals;

  const defaultFeedback =
    answeredCount === 0
      ? 'No substantive answers were submitted. Complete the interview with real responses (at least a short paragraph per question) to receive a meaningful score.'
      : `You gave substantive answers to ${answeredCount} of ${n} questions. Use the per-question feedback to improve structure and examples.`;

  let hire_recommendation = 'No';
  if (answeredCount === 0) {
    hire_recommendation = 'No';
  } else if (['Strong Yes', 'Yes', 'Maybe', 'No'].includes(raw?.hire_recommendation)) {
    hire_recommendation = raw.hire_recommendation;
    if (overall_score < 40 && hire_recommendation === 'Strong Yes') hire_recommendation = 'Maybe';
    if (overall_score < 25 && (hire_recommendation === 'Yes' || hire_recommendation === 'Strong Yes'))
      hire_recommendation = 'No';
  } else if (overall_score >= 75 && answeredCount === n) {
    hire_recommendation = 'Yes';
  } else if (overall_score >= 45) {
    hire_recommendation = 'Maybe';
  }

  return {
    evaluations,
    overall_score,
    overall_feedback:
      typeof raw?.overall_feedback === 'string' && raw.overall_feedback.trim().length > 20 && answeredCount > 0
        ? raw.overall_feedback.trim()
        : defaultFeedback,
    hire_recommendation,
    speech_verdict:
      answeredCount === 0
        ? 'No spoken or typed answers were long enough to assess delivery.'
        : typeof raw?.speech_verdict === 'string' && raw.speech_verdict.trim().length > 8
          ? raw.speech_verdict.trim()
          : 'Focus on steady pacing, fewer fillers, and finishing with a clear takeaway.',
    top_strength:
      answeredCount === 0
        ? '—'
        : typeof raw?.top_strength === 'string' && raw.top_strength.trim().length > 5
          ? raw.top_strength.trim()
          : answeredCount >= 3
            ? 'You attempted most questions with real detail'
            : 'You provided at least one answer we could score',
    top_improvement:
      answeredCount === 0
        ? 'Answer each question with at least 8+ words so the AI can evaluate your content.'
        : typeof raw?.top_improvement === 'string' && raw.top_improvement.trim().length > 5
          ? raw.top_improvement.trim()
          : 'Structure answers: context → action → result (add one metric where possible)',
  };
}

// ─── POST /api/mock-interview/questions ───
router.post('/questions', async (req, res) => {
  try {
    const { resumeText = '', jobRole = 'Software Engineer' } = req.body;

    const prompt = `You are an expert interviewer. Generate exactly 5 interview questions for a ${jobRole} candidate.
Resume excerpt: ${resumeText.slice(0, 2000)}

Return ONLY a valid JSON object (no markdown):
{
  "questions": [
    { "id": 1, "type": "Behavioral",   "question": "...", "tip": "short 1-line tip for the candidate" },
    { "id": 2, "type": "Technical",    "question": "...", "tip": "..." },
    { "id": 3, "type": "Situational",  "question": "...", "tip": "..." },
    { "id": 4, "type": "Deep-Dive",    "question": "...", "tip": "..." },
    { "id": 5, "type": "Motivation",   "question": "...", "tip": "..." }
  ]
}
Tailor each question to the resume content and job role. Make them challenging but fair.`;

    let questions;
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: process.env.GROQ_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(response.choices[0].message.content);
      questions = Array.isArray(parsed.questions) ? parsed.questions : null;
    } catch (aiErr) {
      console.error('AI question generation failed, using fallback:', aiErr.message);
      questions = [
        { id: 1, type: 'Behavioral',  question: `Tell me about a time you faced a significant challenge in your previous ${jobRole} role. How did you handle it?`, tip: 'Use the STAR method: Situation, Task, Action, Result' },
        { id: 2, type: 'Technical',   question: `Walk me through your approach to designing a scalable system for a high-traffic application relevant to ${jobRole}.`, tip: 'Focus on architecture decisions and trade-offs' },
        { id: 3, type: 'Situational', question: `If you joined our team and found the existing codebase had significant technical debt, how would you approach it?`, tip: 'Show prioritization and communication skills' },
        { id: 4, type: 'Deep-Dive',   question: `What's the most complex project you've worked on? Explain the technical details and your specific contributions.`, tip: 'Be specific about your individual impact with numbers' },
        { id: 5, type: 'Motivation',  question: `Why are you interested in this ${jobRole} position, and where do you see yourself in 3-5 years?`, tip: 'Align your goals with the company growth trajectory' },
      ];
    }

    if (!Array.isArray(questions) || questions.length < 1) {
      questions = [
        { id: 1, type: 'Behavioral',  question: `Tell me about a time you faced a significant challenge in your previous ${jobRole} role. How did you handle it?`, tip: 'Use the STAR method: Situation, Task, Action, Result' },
        { id: 2, type: 'Technical',   question: `Walk me through your approach to designing a scalable system for a high-traffic application relevant to ${jobRole}.`, tip: 'Focus on architecture decisions and trade-offs' },
        { id: 3, type: 'Situational', question: `If you joined our team and found the existing codebase had significant technical debt, how would you approach it?`, tip: 'Show prioritization and communication skills' },
        { id: 4, type: 'Deep-Dive',   question: `What's the most complex project you've worked on? Explain the technical details and your specific contributions.`, tip: 'Be specific about your individual impact with numbers' },
        { id: 5, type: 'Motivation',  question: `Why are you interested in this ${jobRole} position, and where do you see yourself in 3-5 years?`, tip: 'Align your goals with the company growth trajectory' },
      ];
    }

    res.json({ questions, jobRole });
  } catch (err) {
    console.error('Mock interview questions error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate questions' });
  }
});

// ─── POST /api/mock-interview/transcribe ───
// Browser Web Speech API uses Google cloud and often fails with "network" offline/firewall.
// This uses Groq Whisper on the server so mic audio becomes text reliably when GROQ_API_KEY is set.
router.post('/transcribe', uploadAudio.single('audio'), async (req, res) => {
  try {
    if (!req.file?.buffer?.length) {
      return res.status(400).json({ error: 'No audio uploaded' });
    }
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        error: 'Speech-to-text is not configured (missing GROQ_API_KEY on the server).',
      });
    }

    const OpenAI = require('openai');
    const { toFile } = require('openai/uploads');

    const openai = new OpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,
    });

    const mime = req.file.mimetype || 'audio/webm';
    const ext = mime.includes('mp4') || mime.includes('m4a') ? 'm4a' : mime.includes('wav') ? 'wav' : 'webm';
    const file = await toFile(req.file.buffer, `recording.${ext}`, { type: mime });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3',
    });

    const text = (transcription.text || '').trim();
    res.json({ text });
  } catch (err) {
    console.error('Mock interview transcribe error:', err.message);
    res.status(500).json({ error: err.message || 'Transcription failed' });
  }
});

// ─── POST /api/mock-interview/evaluate ───
router.post('/evaluate', async (req, res) => {
  try {
    const { jobRole = 'Software Engineer', speechStats = {} } = req.body;
    const qa = Array.isArray(req.body.qa) ? req.body.qa : [];

    if (qa.length < 1) {
      return res.status(400).json({ error: 'No interview answers to evaluate.' });
    }

    const qaBlock = qa.map((item, i) =>
      `Q${i + 1} (${item.type}): ${item.question}\nAnswer: ${item.answer || '[SKIPPED]'}\nWPM: ${item.wpm || 0}, Fillers: ${item.fillerCount || 0}, Confidence: ${item.confidenceScore || 0}`
    ).join('\n\n');

    const qCount = qa.length;
    const prompt = `You are a senior interview evaluator for a ${jobRole} role.

${qaBlock}

Speech Stats: avg WPM=${speechStats.avgWPM || 0}, total fillers=${speechStats.totalFillers || 0}, avg confidence=${speechStats.avgConfidence || 0}

CRITICAL: Return ONLY valid JSON. The "evaluations" array MUST contain exactly ${qCount} objects, in order for Q1 through Q${qCount} (same order as above). Each evaluation must reference that question's actual answer text.

If an answer is empty, "[SKIPPED]", or fewer than 8 words, you MUST set content_score, delivery_score, and overall_score to 0 for that question. Do not invent praise or mid-range scores for missing answers.

Return ONLY a valid JSON object:
{
  "evaluations": [
    {
      "id": 1,
      "content_score": number 0-100,
      "delivery_score": number 0-100,
      "overall_score": number 0-100,
      "feedback": "2-3 sentence specific feedback tied to their answer",
      "ideal_answer": "a strong example answer in 2-3 sentences for THIS question",
      "keyword_hits": ["relevant keyword 1", "keyword 2"]
    }
  ],
  "overall_score": number 0-100,
  "overall_feedback": "2-3 sentences about the entire interview performance",
  "hire_recommendation": "Strong Yes" or "Yes" or "Maybe" or "No",
  "speech_verdict": "1 sentence about their speech delivery",
  "top_strength": "the single biggest strength shown",
  "top_improvement": "the single most important area to improve"
}
Score skipped or very short answers as 0 for content. Be honest but constructive. Penalize heavily for skipped answers.`;

    let result;
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: process.env.GROQ_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      result = JSON.parse(response.choices[0].message.content);
    } catch (aiErr) {
      console.error('AI evaluation failed, using fallback:', aiErr.message);
      result = { evaluations: [], overall_score: 0 };
    }

    const normalized = normalizeInterviewResult(result, qa);
    res.json(normalized);
  } catch (err) {
    console.error('Mock interview evaluate error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to evaluate interview' });
  }
});

module.exports = router;
