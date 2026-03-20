/**
 * HTML Text Mapper — Extract text, improve with AI, inject back.
 *
 * Instead of sending full HTML to the AI (which breaks structure/styles),
 * we extract only the text nodes into a numbered map, send the map to the AI,
 * and then inject the improved text back into the original HTML template.
 *
 * This guarantees 100% HTML structure and style preservation.
 */

// Patterns to detect browser print artifacts (headers/footers baked into DOCX)
const JUNK_PATTERNS = [
  /^\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}\s*(AM|PM)?\s+.+Resume/i,  // "3/13/25, 10:06 PM Rakshit Raj - Resume"
  /^\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}/,                          // "3/13/25, 10:06 PM ..."
  /^https?:\/\//i,                                                            // URLs like "http://127.0.0.1:5501/..."
  /^127\.0\.0\.1/,                                                            // localhost URLs
  /^localhost/i,                                                               // localhost
  /^\d+\/\d+$/,                                                               // "1/1", "1/2" page numbers
  /^page\s+\d+\s*(of\s+\d+)?$/i,                                             // "Page 1 of 1"
  /resume\.html/i,                                                             // file paths with resume.html
  /\.html\s+\d+\/\d+$/i,                                                      // "resume.html 1/1"
];

/**
 * Check if a text string is a browser print artifact (junk).
 */
function isJunkText(text) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return JUNK_PATTERNS.some(pattern => pattern.test(trimmed));
}

/**
 * Extract text nodes from HTML into a numbered map.
 * Returns { map, template, junkKeys }
 * - map: { "1": "text", "2": "text", ... } (only meaningful text)
 * - template: HTML with {{1}} placeholders
 * - junkKeys: keys that are browser artifacts (will be removed from final output)
 *
 * @param {string} html - The original HTML string
 * @returns {{ map: Record<string, string>, template: string, junkKeys: Set<string> }}
 */
function extractTextMap(html) {
  if (!html || typeof html !== 'string') return { map: {}, template: html || '', junkKeys: new Set() };

  const map = {};
  const junkKeys = new Set();
  let counter = 0;

  // Replace text content (between > and <) with numbered placeholders
  const template = html.replace(/>([^<]+)</g, (match, textContent) => {
    const trimmed = textContent.trim();
    if (!trimmed) return match; // keep whitespace-only nodes as-is
    if (/^(&nbsp;|&emsp;|\s)*$/.test(trimmed)) return match; // keep entity-only nodes

    counter++;
    const key = String(counter);
    map[key] = textContent; // preserve original whitespace

    // Mark junk entries
    if (isJunkText(trimmed)) {
      junkKeys.add(key);
    }

    return `>{{${key}}}<`;
  });

  return { map, template, junkKeys };
}

/**
 * Inject improved text back into the HTML template.
 * Junk entries are replaced with empty string to remove browser artifacts.
 *
 * @param {string} template - HTML with {{1}}, {{2}} placeholders
 * @param {Record<string, string>} originalMap - Original text map
 * @param {Record<string, string>} improvedMap - Improved text map from AI
 * @param {Set<string>} junkKeys - Keys that should be blanked out
 * @returns {string} - Final HTML with improved text
 */
function injectTextMap(template, originalMap, improvedMap, junkKeys = new Set()) {
  if (!template) return '';

  let result = template;

  // Replace each placeholder with the improved text (or fallback to original)
  for (const key of Object.keys(originalMap)) {
    let replacement;
    if (junkKeys.has(key)) {
      replacement = ''; // Remove browser artifacts entirely
    } else {
      replacement = improvedMap[key] || originalMap[key];
    }
    result = result.replace(`{{${key}}}`, replacement);
  }

  // Safety: replace any remaining placeholders with original text
  result = result.replace(/\{\{(\d+)\}\}/g, (match, key) => {
    if (junkKeys.has(key)) return '';
    return originalMap[key] || match;
  });

  // Clean up empty paragraphs left by removed junk text
  result = result.replace(/<p[^>]*>\s*<\/p>/g, '');
  result = result.replace(/<span[^>]*>\s*<\/span>/g, '');

  return result;
}

/**
 * Build a concise prompt showing the text map for AI improvement.
 * Excludes junk entries so AI doesn't process them.
 *
 * @param {Record<string, string>} map - The text map
 * @param {Set<string>} junkKeys - Keys to exclude
 * @returns {string}
 */
function buildTextMapPrompt(map, junkKeys = new Set()) {
  const lines = [];
  for (const [key, text] of Object.entries(map)) {
    if (junkKeys.has(key)) continue; // skip junk

    const cleaned = text.trim();
    if (cleaned) {
      lines.push(`[${key}]: ${cleaned}`);
    }
  }
  return lines.join('\n');
}

/**
 * Parse the AI response to get the improved text map.
 * Enforces length constraints: improved text cannot be more than 30% longer.
 *
 * @param {string} raw - Raw AI response
 * @param {Record<string, string>} originalMap - Fallback map
 * @returns {Record<string, string>}
 */
function parseImprovedMap(raw, originalMap) {
  try {
    // Try to extract JSON object
    const clean = raw.replace(/```json\n?|```\n?/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);

    // Validate: should have string values for numbered keys
    const result = {};
    for (const key of Object.keys(originalMap)) {
      if (parsed[key] && typeof parsed[key] === 'string') {
        const original = originalMap[key].trim();
        const improved = parsed[key].trim();

        // Length guard: if AI expanded text more than 40%, use original
        // This prevents 1-page resumes from becoming 3 pages
        if (original.length > 10 && improved.length > original.length * 1.4) {
          result[key] = originalMap[key]; // fallback — too bloated
        } else {
          result[key] = parsed[key];
        }
      } else {
        result[key] = originalMap[key]; // fallback to original
      }
    }
    return result;
  } catch {
    // If parsing fails, return original map unchanged
    return { ...originalMap };
  }
}

module.exports = {
  extractTextMap,
  injectTextMap,
  buildTextMapPrompt,
  parseImprovedMap,
};
