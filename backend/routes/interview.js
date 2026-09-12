const express = require('express');
const { generateAIResponse } = require('../utils/aiClient');

const router = express.Router();

// POST /api/interview-questions
router.post('/interview-questions', async (req, res) => {
  try {
    const {
      jobRole = 'Software Engineer',
      strengths = [],
      weaknesses = [],
      ats_keywords_missing = [],
    } = req.body;

    const prompt = `You are an executive tech interviewer and career coach. Generate 5 targeted interview questions for a ${jobRole} candidate.
Tailor questions to probe their strengths, address weaknesses, and test missing competencies.

Candidate strengths: ${strengths.slice(0, 4).join(', ') || 'technical fundamentals'}
Candidate areas for growth: ${weaknesses.slice(0, 4).join(', ') || 'metrics and system trade-offs'}
Target keywords: ${ats_keywords_missing.slice(0, 6).join(', ') || 'scalable engineering'}

Return ONLY a valid JSON object (no markdown, no backticks):
{
  "questions": [
    "question string 1",
    "question string 2",
    "question string 3",
    "question string 4",
    "question string 5"
  ],
  "detailedQuestions": [
    {
      "question": "question string",
      "category": "Technical | Behavioral (STAR) | Situational | Architecture",
      "competency": "core competency being evaluated",
      "coachingTip": "1 concise tip on how candidate should frame their answer"
    }
  ]
}`;

    let raw = '';
    try {
      raw = await generateAIResponse({
        prompt,
        systemPrompt: 'You are an elite technical interview preparation strategist. Output valid JSON only.',
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
      });
    } catch (aiErr) {
      console.warn('AI interview generation failed, using structured fallback:', aiErr.message);
    }

    let result;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      result = {
        questions: [
          `Can you walk me through the architecture and impact of your most complex project as a ${jobRole}?`,
          'Tell me about a time you resolved a major production bottleneck under high pressure.',
          'How do you balance technical debt with delivering product features rapidly?',
          'Describe a situation where you had to push back on requirements using data or benchmarks.',
          'How do you stay up-to-date with emerging tools and lead knowledge-sharing within your team?',
        ],
        detailedQuestions: [
          {
            question: `Can you walk me through the architecture and impact of your most complex project as a ${jobRole}?`,
            category: 'Technical',
            competency: 'System Architecture & Impact',
            coachingTip: 'Use numbers: state user scale, latency reductions, or throughput improvements.',
          },
          {
            question: 'Tell me about a time you resolved a major production bottleneck under high pressure.',
            category: 'Situational',
            competency: 'Debugging & Incident Response',
            coachingTip: 'Structure using Situation-Task-Action-Result, emphasizing your root-cause analysis.',
          },
          {
            question: 'How do you balance technical debt with delivering product features rapidly?',
            category: 'Behavioral (STAR)',
            competency: 'Pragmatic Engineering & Trade-offs',
            coachingTip: 'Explain how you communicate risk to product stakeholders and schedule refactoring.',
          },
          {
            question: 'Describe a situation where you had to push back on requirements using data or benchmarks.',
            category: 'Behavioral (STAR)',
            competency: 'Cross-functional Influence',
            coachingTip: 'Focus on collaboration and win-win solutions rather than conflict.',
          },
          {
            question: 'How do you stay up-to-date with emerging tools and lead knowledge-sharing within your team?',
            category: 'Architecture',
            competency: 'Continuous Learning & Mentorship',
            coachingTip: 'Highlight tech talks, RFC docs, or mentorship initiatives you participated in.',
          },
        ],
      };
    }

    // Ensure questions array is always present
    if (!result.questions && Array.isArray(result.detailedQuestions)) {
      result.questions = result.detailedQuestions.map((q) => q.question);
    }

    res.json(result);
  } catch (err) {
    console.error('Interview error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
