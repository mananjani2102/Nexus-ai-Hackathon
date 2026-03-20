/**
 * DOCX Text Replacer — Modify text directly inside DOCX XML.
 *
 * This modifies the document.xml inside the DOCX ZIP file,
 * replacing only <w:t> text content while preserving ALL formatting,
 * tables, colors, fonts, styles, and layout.
 *
 * This is the most reliable way to preserve 100% of the original formatting.
 */

const JSZip = require('jszip');

// Patterns to detect browser print artifacts
const JUNK_PATTERNS = [
  /^\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}\s*(AM|PM)?\s+.+Resume/i,
  /^\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}/,
  /^https?:\/\//i,
  /^127\.0\.0\.1/,
  /^localhost/i,
  /^\d+\/\d+$/,
  /^page\s+\d+\s*(of\s+\d+)?$/i,
  /resume\.html/i,
  /\.html\s+\d+\/\d+$/i,
];

function isJunkText(text) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return JUNK_PATTERNS.some(pattern => pattern.test(trimmed));
}

/**
 * Extract text nodes from DOCX document.xml into a numbered map.
 * Only extracts <w:t> content — the actual visible text.
 *
 * @param {string} docXml - The document.xml content
 * @returns {{ map: Record<string, string>, template: string, junkKeys: Set<string> }}
 */
function extractDocxTextMap(docXml) {
  const map = {};
  const junkKeys = new Set();
  let counter = 0;

  // Match all <w:t ...>text</w:t> and <w:t>text</w:t> patterns
  const template = docXml.replace(/<w:t([^>]*)>([^<]*)<\/w:t>/g, (match, attrs, textContent) => {
    // Skip empty text
    if (!textContent || !textContent.trim()) return match;

    counter++;
    const key = String(counter);
    map[key] = textContent;

    if (isJunkText(textContent.trim())) {
      junkKeys.add(key);
    }

    return `<w:t${attrs}>{{DOCX_TEXT_${key}}}</w:t>`;
  });

  return { map, template, junkKeys };
}

/**
 * Inject improved text back into document.xml template.
 *
 * @param {string} template - document.xml with placeholders
 * @param {Record<string, string>} originalMap - Original text
 * @param {Record<string, string>} improvedMap - AI-improved text
 * @param {Set<string>} junkKeys - Keys to blank out
 * @returns {string}
 */
function injectDocxTextMap(template, originalMap, improvedMap, junkKeys = new Set()) {
  let result = template;

  for (const key of Object.keys(originalMap)) {
    let replacement;
    if (junkKeys.has(key)) {
      replacement = ''; // Remove browser artifacts
    } else {
      replacement = improvedMap[key] || originalMap[key];
    }
    result = result.replace(`{{DOCX_TEXT_${key}}}`, escapeXml(replacement));
  }

  // Safety: replace any remaining placeholders
  result = result.replace(/\{\{DOCX_TEXT_(\d+)\}\}/g, (match, key) => {
    if (junkKeys.has(key)) return '';
    return escapeXml(originalMap[key] || '');
  });

  return result;
}

/**
 * Escape special XML characters in text.
 */
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Un-escape XML entities that were in the original (the original text from XML is already escaped).
 * We need to handle this carefully — the original text from XML may contain &amp; etc.
 * Since we're extracting from XML and putting back, we should NOT double-escape.
 */
function unescapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Modify a DOCX buffer by replacing text content while preserving ALL formatting.
 *
 * @param {Buffer} docxBuffer - Original DOCX file buffer
 * @param {Record<string, string>} improvedMap - AI-improved text map (key → improved text)
 * @param {Set<string>} junkKeys - Keys to remove
 * @returns {Promise<Buffer>} - Modified DOCX buffer
 */
async function modifyDocxText(docxBuffer, improvedMap, junkKeys = new Set()) {
  const zip = await JSZip.loadAsync(docxBuffer);

  // Get the document.xml
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) throw new Error('Invalid DOCX: no document.xml found');

  let docXml = await docXmlFile.async('string');

  // Extract text map from the XML
  const { map, template } = extractDocxTextMap(docXml);

  // The improved map keys should align with our extracted keys
  // Un-escape the original map values for comparison (since they come from XML)
  const unescapedOriginal = {};
  for (const [key, val] of Object.entries(map)) {
    unescapedOriginal[key] = unescapeXml(val);
  }

  // Build the final improved map, un-escaping AI output
  // (injectDocxTextMap will re-escape it)
  const finalImproved = {};
  for (const key of Object.keys(map)) {
    if (junkKeys.has(key)) {
      finalImproved[key] = '';
    } else if (improvedMap[key]) {
      finalImproved[key] = improvedMap[key];
    } else {
      // Keep original (un-escaped version since injectDocxTextMap will re-escape)
      finalImproved[key] = unescapedOriginal[key];
    }
  }

  // Inject back into template
  const modifiedXml = injectDocxTextMap(template, unescapedOriginal, finalImproved, junkKeys);

  // Replace document.xml in the ZIP
  zip.file('word/document.xml', modifiedXml);

  // Generate the modified DOCX buffer
  const outputBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return outputBuffer;
}

/**
 * Build text map prompt for AI (same as htmlTextMapper but from DOCX).
 */
function buildDocxTextMapPrompt(map, junkKeys = new Set()) {
  const lines = [];
  for (const [key, text] of Object.entries(map)) {
    if (junkKeys.has(key)) continue;
    const cleaned = text.trim();
    if (cleaned) {
      lines.push(`[${key}]: ${cleaned}`);
    }
  }
  return lines.join('\n');
}

/**
 * Parse AI response for DOCX text map with length enforcement.
 */
function parseDocxImprovedMap(raw, originalMap) {
  try {
    const clean = raw.replace(/```json\n?|```\n?/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);

    const result = {};
    for (const key of Object.keys(originalMap)) {
      if (parsed[key] && typeof parsed[key] === 'string') {
        const original = originalMap[key].trim();
        const improved = parsed[key].trim();

        // Length guard: reject text expanded more than 40%
        if (original.length > 10 && improved.length > original.length * 1.4) {
          result[key] = originalMap[key];
        } else {
          result[key] = parsed[key];
        }
      } else {
        result[key] = originalMap[key];
      }
    }
    return result;
  } catch {
    return { ...originalMap };
  }
}

module.exports = {
  extractDocxTextMap,
  injectDocxTextMap,
  modifyDocxText,
  buildDocxTextMapPrompt,
  parseDocxImprovedMap,
  isJunkText,
};
