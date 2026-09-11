const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Shared Groq client
const groqClient = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || 'placeholder_groq_key',
});

// Optional Gemini fallback client
let geminiClient = null;
if (process.env.GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (err) {
    console.warn('Gemini client initialization skipped:', err.message);
  }
}

/**
 * Call Groq LLaMA model with transparent fallback to Gemini if rate-limited or unavailable.
 *
 * @param {Object} options
 * @param {string} options.prompt - Main user prompt
 * @param {string} [options.systemPrompt] - System instruction
 * @param {string} [options.model] - Groq model identifier
 * @param {number} [options.temperature=0.2]
 * @param {number} [options.maxTokens=2048]
 * @returns {Promise<string>} Model raw output text
 */
async function generateAIResponse({
  prompt,
  systemPrompt = 'You are an expert ATS resume evaluator and career coach.',
  model = 'llama-3.1-8b-instant',
  temperature = 0.2,
  maxTokens = 2048,
}) {
  // 1. Primary Attempt: Groq LLaMA
  try {
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const completion = await groqClient.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (content && content.trim().length > 0) {
      return content.trim();
    }
    throw new Error('Empty response received from Groq API');
  } catch (groqErr) {
    console.warn(`[AI] Groq request failed (${groqErr.message}). Attempting fallback chain...`);

    // 2. Secondary Attempt: Google Gemini
    if (geminiClient && process.env.GEMINI_API_KEY) {
      try {
        const geminiModel = geminiClient.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        });

        const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
        const result = await geminiModel.generateContent(fullPrompt);
        const text = result?.response?.text();
        if (text && text.trim().length > 0) {
          console.info('[AI] Successfully resolved request using Gemini fallback.');
          return text.trim();
        }
      } catch (geminiErr) {
        console.error('[AI] Gemini fallback also failed:', geminiErr.message);
      }
    }

    // Re-throw so caller route can use its localized heuristic fallback
    throw groqErr;
  }
}

module.exports = {
  groqClient,
  generateAIResponse,
};
