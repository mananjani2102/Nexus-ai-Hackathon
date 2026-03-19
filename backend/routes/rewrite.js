const express = require('express');
const {
  extractTextMap,
  injectTextMap,
  buildTextMapPrompt,
  parseImprovedMap,
} = require('../utils/htmlTextMapper');
const { getDocxBuffer } = require('../utils/docxStore');
const { modifyDocxText } = require('../utils/docxTextReplacer');

const router = express.Router();

router.post('/rewrite-resume', async (req, res) => {
  try {
    const {
      resumeText,
      resumeHtml,
      resumeFormat,
      jobRole = 'Software Engineer',
      weaknesses = [],
      ats_keywords_missing = [],
      docxId, // Extract docxId from request
    } = req.body;

    if (!resumeText) return res.status(400).json({ error: 'Resume text is required' });

    const isHtml = resumeFormat === 'docx' && resumeHtml && resumeHtml.trim() !== '';
    const keywords = ats_keywords_missing.slice(0, 10).join(', ');
    const weak = weaknesses.slice(0, 5).join(' | ');

    if (isHtml) {
      // ────────────────────────────────────────────────────────
      // HTML RESUME (DOCX) — Text-Map approach
      // Extract text nodes, send ONLY text to AI, inject back
      // This guarantees 100% HTML structure & style preservation
      // ────────────────────────────────────────────────────────

      const { map, template, junkKeys } = extractTextMap(resumeHtml);

      // Build the text prompt excluding junk entries
      const textMapPrompt = buildTextMapPrompt(map, junkKeys);
      const validKeys = Object.keys(map).filter(k => !junkKeys.has(k));
      const totalKeys = validKeys.length;

      const htmlPrompt = `You are a professional resume content improver for the role of ${jobRole}.

You receive a numbered text map extracted from a 1-PAGE resume. Each line is [KEY]: TEXT.
Your job: improve ONLY the text, return the SAME keys with improved values.

STRICT LENGTH RULES (MOST IMPORTANT):
- This is a 1-PAGE resume. It MUST stay 1 page. Do NOT make it longer.
- Each improved text MUST be the SAME LENGTH or SHORTER than the original.
- NEVER add extra sentences, extra details, or extra phrases.
- If original is 8 words, improved must be 8 words or fewer.
- Keep bullet points concise — one line max.
- DO NOT expand abbreviations into full sentences.

DO NOT CHANGE (keep exactly as-is):
- Names, emails, phone numbers, addresses
- University names, company names, dates
- Section headings (SKILLS, EDUCATION, INTERESTS, etc.)
- Short labels (1-3 words) like skill names, tool names
- Links and URLs

WHAT TO IMPROVE (text content only):
- Replace weak verbs: helped→spearheaded, worked→engineered, did→implemented, made→developed
- Add 1-2 specific metrics where missing (e.g., "managed team"→"managed team of 8")
- Fix grammar and passive voice
- ATS keywords to weave in naturally: ${keywords}
- Weaknesses to address: ${weak}

INPUT TEXT MAP (${totalKeys} entries):
${textMapPrompt}

Return ONLY raw JSON: {"1":"text","2":"text",...}
No markdown. No code fences. No explanation.`;

      let raw = '';
      try {
        const OpenAI = require('openai');
        const openai = new OpenAI({
          baseURL: "https://api.groq.com/openai/v1",
          apiKey: process.env.GROQ_API_KEY,
        });
        
        const response = await openai.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [{ 
            role: "user", 
            content: 'System: You are a JSON-only API. You output a JSON object mapping numbered keys to improved resume text. CRITICAL: keep each value the SAME length or shorter than the input. Never expand text. Never add sentences.\n\nUser: ' + htmlPrompt
          }]
        });
        raw = response.choices[0].message.content;
      } catch (err) {
        console.error('OpenRouter AI failed:', err.message);
        return res.status(503).json({ error: err.message });
      }
      const improvedMap = parseImprovedMap(raw, map);
      const finalHtml = injectTextMap(template, map, improvedMap, junkKeys);

      // Build a changes summary: only include entries that actually changed
      const changes = [];
      for (const key of Object.keys(map)) {
        if (junkKeys.has(key)) continue;
        const orig = (map[key] || '').trim();
        const improved = (improvedMap[key] || '').trim();
        if (orig && improved && orig !== improved) {
          changes.push({ original: orig, improved });
        }
      }

      let docxBase64 = null;
      if (docxId) {
        try {
          const originalBuffer = getDocxBuffer(docxId);
          if (originalBuffer) {
            const modifiedBuffer = await modifyDocxText(originalBuffer, improvedMap, junkKeys);
            docxBase64 = modifiedBuffer.toString('base64');
          }
        } catch (e) {
          console.error('Failed to generate modified DOCX:', e.message);
        }
      }

      return res.json({ rewritten: finalHtml, docxBase64, changes });
    }

    // ────────────────────────────────────────────────────────
    // PLAIN TEXT RESUME (PDF) — Direct text improvement
    // ────────────────────────────────────────────────────────

    const inputContent = resumeText.slice(0, 6000);

    const plainTextPrompt = `You are a professional resume writer improving a 1-PAGE resume for the role of ${jobRole}.

STRICT LENGTH RULES (MOST IMPORTANT):
1. This is a 1-PAGE resume. Output MUST be the SAME length or shorter.
2. Do NOT add extra bullet points, sentences, or paragraphs.
3. Keep every bullet point to 1 line max.
4. Preserve every blank line, indentation, and line break exactly.
5. Preserve all section headings exactly.
6. Preserve all bullet characters (•, -, *) exactly.
7. Do not merge, reorder, add, or remove sections.

IMPROVEMENTS TO MAKE:
- Replace weak verbs with strong action verbs
- Add 1-2 specific metrics where missing
- Weave in ATS keywords: ${keywords}
- Fix weaknesses: ${weak}
- Fix grammar, spelling, passive voice

INPUT RESUME:
${inputContent}

Return ONLY raw JSON. No markdown. No code fences.
{"rewritten":"COMPLETE_RESUME_TEXT_HERE"}`;

    let raw = '';
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY,
      });
      
      const response = await openai.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ 
          role: "user", 
          content: 'System: You are a JSON-only API. Output raw JSON only. CRITICAL: the output resume must be the SAME length or shorter than the input. Never expand.\n\nUser: ' + plainTextPrompt
        }]
      });
      raw = response.choices[0].message.content;
    } catch (err) {
      console.error('OpenRouter AI failed:', err.message);
      return res.status(503).json({ error: err.message });
    }

    let result;
    try {
      const clean = raw.replace(/```json\n?|```\n?/g, '').trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : clean);
    } catch {
      result = { rewritten: resumeText };
    }

    res.json({ rewritten: result.rewritten || resumeText });

  } catch (err) {
    console.error('Rewrite error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;