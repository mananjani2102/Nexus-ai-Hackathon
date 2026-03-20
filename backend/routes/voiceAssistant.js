const express = require('express');
const router = express.Router();

// ─── POST /api/voice-assistant/chat ───
router.post('/chat', async (req, res) => {
  try {
    const { message, resumeText = '', jobRole = 'Software Engineer', history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const systemPrompt = `You are Nexus, an expert AI resume coach. Resume: ${resumeText.slice(0, 2000)}. Job Role: ${jobRole}. Answer only resume/career questions. Be specific, max 2-3 sentences, actionable.`;

    // Keep only the last 6 messages from history
    const recentHistory = history.slice(-6).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const OpenAI = require('openai');
    const openai = new OpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        ...recentHistory,
        { role: 'user', content: message },
      ],
      max_tokens: 200,
      temperature: 0.6,
    });

    const reply = response.choices[0].message.content.trim();
    res.json({ reply });
  } catch (err) {
    console.error('Voice assistant chat error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate response' });
  }
});

module.exports = router;
