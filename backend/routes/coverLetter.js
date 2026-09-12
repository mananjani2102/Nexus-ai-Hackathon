const express = require('express');
const { generateAIResponse } = require('../utils/aiClient');

const router = express.Router();

/**
 * POST /api/cover-letter
 * Generates an ATS-optimized, high-conversion cover letter
 * tailored to a specific job description and company.
 */
router.post('/cover-letter', async (req, res) => {
  try {
    const {
      resumeText = '',
      jobRole = 'Software Engineer',
      companyName = 'Hiring Team',
      jobDescription = '',
      tone = 'professional',
    } = req.body;

    if (!resumeText || resumeText.trim().length < 40) {
      return res.status(400).json({
        error: 'Resume text is required to generate a tailored cover letter.',
      });
    }

    const jdSnippet = jobDescription.trim()
      ? `Target Job Description:\n${jobDescription.slice(0, 1500)}\n\n`
      : '';

    const toneGuide = {
      conversational: 'warm, engaging, authentic and modern, without sounding overly stiff.',
      confident: 'bold, direct, highlighting major leadership and quantified business outcomes.',
      professional: 'polished, structured, respectful, and focused on domain expertise and execution.',
    }[tone] || 'polished and professional.';

    const prompt = `You are an elite career strategist. Draft a high-impact cover letter for the role of "${jobRole}" at "${companyName}".
Tone should be: ${toneGuide}

${jdSnippet}Candidate Resume Highlights:
${resumeText.slice(0, 2500)}

Return ONLY a valid JSON object matching this structure:
{
  "coverLetter": "Full markdown-formatted cover letter text with 3-4 paragraphs (opening hook, key technical/impact accomplishments, culture/value alignment, concise call to action). Use [Your Name] as placeholder at the end.",
  "keyStrengthsHighlighted": ["strength 1", "strength 2", "strength 3"],
  "toneUsed": "${tone}"
}`;

    let raw = '';
    try {
      raw = await generateAIResponse({
        prompt,
        systemPrompt: 'You are an executive cover letter writer. Return ONLY a valid JSON object without markdown fences.',
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
      });
    } catch (aiErr) {
      console.warn('AI cover letter generation failed, using structured template fallback:', aiErr.message);
    }

    let result;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      result = {
        coverLetter: `Dear Hiring Team at ${companyName},\n\nI am excited to submit my application for the ${jobRole} position. With a strong track record of designing scalable systems, solving complex engineering bottlenecks, and delivering business value, I am eager to contribute to your team's ongoing initiatives.\n\nThroughout my career, I have consistently focused on building reliable, high-performance solutions while collaborating closely with cross-functional partners. My background aligns directly with the core competencies required for this role, particularly in delivering measurable engineering outcomes and maintaining architectural integrity.\n\nI welcome the opportunity to discuss how my technical skills and proactive problem-solving mindset can support ${companyName}'s goals. Thank you for your time and consideration.\n\nSincerely,\n[Your Name]`,
        keyStrengthsHighlighted: [
          'Demonstrated engineering track record in scalable solutions',
          'Cross-functional leadership and stakeholder communication',
          'Commitment to code quality, testing, and continuous delivery',
        ],
        toneUsed: tone,
      };
    }

    res.json(result);
  } catch (err) {
    console.error('Cover letter route error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate cover letter.' });
  }
});

module.exports = router;
