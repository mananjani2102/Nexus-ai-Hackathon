const JSZip = require('jszip');
const xml2js = require('xml2js');

// ── Helpers ──────────────────────────────────────────────────────────────────

function findChildren(el, tagName) {
  if (!el || !el.$$) return [];
  return el.$$.filter(c => c['#name'] === tagName);
}

function findChild(el, tagName) {
  if (!el || !el.$$) return null;
  return el.$$.find(c => c['#name'] === tagName);
}

function attr(el, name) {
  return el?.$?.[name];
}

function getTextContent(el) {
  if (!el) return '';
  // Direct text
  if (el._) return el._;
  // Text children
  if (el.$$) {
    return el.$$.filter(c => c['#name'] === '__text__').map(c => c._).join('');
  }
  return typeof el === 'string' ? el : '';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Style Extraction ────────────────────────────────────────────────────────

function extractRunProps(rPr) {
  if (!rPr) return {};
  const props = {};

  // Bold
  const b = findChild(rPr, 'w:b');
  if (b) {
    const val = attr(b, 'w:val');
    props.bold = val !== '0' && val !== 'false';
  }

  // Italic
  const i = findChild(rPr, 'w:i');
  if (i) {
    const val = attr(i, 'w:val');
    props.italic = val !== '0' && val !== 'false';
  }

  // Underline
  const u = findChild(rPr, 'w:u');
  if (u) {
    const val = attr(u, 'w:val');
    if (val && val !== 'none') props.underline = true;
  }

  // Color
  const color = findChild(rPr, 'w:color');
  if (color) {
    const val = attr(color, 'w:val');
    if (val && val !== 'auto' && val !== '000000') props.color = val;
  }

  // Font size (in half-points)
  const sz = findChild(rPr, 'w:sz');
  if (sz) {
    const val = attr(sz, 'w:val');
    if (val) props.fontSize = parseInt(val) / 2;
  }

  // Font family
  const rFonts = findChild(rPr, 'w:rFonts');
  if (rFonts) {
    const ascii = attr(rFonts, 'w:ascii') || attr(rFonts, 'w:hAnsi') || attr(rFonts, 'w:cs');
    if (ascii) props.fontFamily = ascii;
  }

  // Caps
  const caps = findChild(rPr, 'w:caps');
  if (caps) {
    const val = attr(caps, 'w:val');
    props.caps = val !== '0' && val !== 'false';
  }

  // Small caps
  const smallCaps = findChild(rPr, 'w:smallCaps');
  if (smallCaps) {
    const val = attr(smallCaps, 'w:val');
    props.smallCaps = val !== '0' && val !== 'false';
  }

  // Strikethrough
  const strike = findChild(rPr, 'w:strike');
  if (strike) {
    const val = attr(strike, 'w:val');
    props.strike = val !== '0' && val !== 'false';
  }

  // Highlight / shading
  const highlight = findChild(rPr, 'w:highlight');
  if (highlight) {
    props.highlight = attr(highlight, 'w:val');
  }

  return props;
}

function extractParaProps(pPr) {
  if (!pPr) return {};
  const props = {};

  // Alignment
  const jc = findChild(pPr, 'w:jc');
  if (jc) {
    const val = attr(jc, 'w:val');
    const map = { center: 'center', right: 'right', both: 'justify', left: 'left', start: 'left', end: 'right' };
    if (map[val]) props.textAlign = map[val];
  }

  // Spacing
  const spacing = findChild(pPr, 'w:spacing');
  if (spacing) {
    const before = attr(spacing, 'w:before');
    const after = attr(spacing, 'w:after');
    const line = attr(spacing, 'w:line');
    if (before) props.marginTop = Math.round(parseInt(before) / 20);
    if (after) props.marginBottom = Math.round(parseInt(after) / 20);
    if (line) props.lineHeight = (parseInt(line) / 240).toFixed(2);
  }

  // Indentation
  const ind = findChild(pPr, 'w:ind');
  if (ind) {
    const left = attr(ind, 'w:left') || attr(ind, 'w:start');
    const hanging = attr(ind, 'w:hanging');
    if (left) props.marginLeft = Math.round(parseInt(left) / 20);
    if (hanging) props.textIndent = -Math.round(parseInt(hanging) / 20);
  }

  // Style reference
  const pStyle = findChild(pPr, 'w:pStyle');
  if (pStyle) {
    props.styleId = attr(pStyle, 'w:val');
  }

  // Numbering (list items)
  const numPr = findChild(pPr, 'w:numPr');
  if (numPr) {
    props.isList = true;
    const ilvl = findChild(numPr, 'w:ilvl');
    if (ilvl) props.listLevel = parseInt(attr(ilvl, 'w:val') || '0');
  }

  // Borders (bottom border often used as section divider)
  const pBdr = findChild(pPr, 'w:pBdr');
  if (pBdr) {
    const bottom = findChild(pBdr, 'w:bottom');
    if (bottom) {
      const bVal = attr(bottom, 'w:val');
      if (bVal && bVal !== 'none') {
        const bColor = attr(bottom, 'w:color') || '000000';
        props.borderBottom = `1px solid #${bColor}`;
      }
    }
  }

  // Background shading
  const shd = findChild(pPr, 'w:shd');
  if (shd) {
    const fill = attr(shd, 'w:fill');
    if (fill && fill !== 'auto' && fill !== 'FFFFFF' && fill !== 'ffffff') {
      props.backgroundColor = `#${fill}`;
    }
  }

  return props;
}

// ── Build Style Map from styles.xml ─────────────────────────────────────────

function buildStyleMap(stylesTree) {
  const map = {};
  if (!stylesTree) return map;

  const root = stylesTree['w:styles'];
  if (!root) return map;

  // Find w:style children
  const rootEl = Array.isArray(root) ? root[0] : root;
  if (!rootEl?.$$) return map;

  const styleEls = rootEl.$$.filter(c => c['#name'] === 'w:style');

  for (const s of styleEls) {
    const id = attr(s, 'w:styleId');
    if (!id) continue;

    const rPr = findChild(s, 'w:rPr');
    const pPr = findChild(s, 'w:pPr');
    const basedOn = findChild(s, 'w:basedOn');

    map[id] = {
      runProps: extractRunProps(rPr),
      paraProps: extractParaProps(pPr),
      basedOn: basedOn ? attr(basedOn, 'w:val') : null,
    };
  }

  // Resolve basedOn inheritance (1 level deep is enough for most cases)
  for (const id of Object.keys(map)) {
    const base = map[id].basedOn;
    if (base && map[base]) {
      map[id].runProps = { ...map[base].runProps, ...map[id].runProps };
      map[id].paraProps = { ...map[base].paraProps, ...map[id].paraProps };
    }
  }

  return map;
}

// ── Merge props: style definition + inline overrides ────────────────────────

function mergeRunProps(styleProps, inlineProps) {
  return { ...styleProps, ...inlineProps };
}

// ── Build inline CSS string from run props ──────────────────────────────────

function runPropsToCss(props) {
  const parts = [];
  if (props.bold) parts.push('font-weight:bold');
  if (props.italic) parts.push('font-style:italic');
  if (props.underline) parts.push('text-decoration:underline');
  if (props.strike) parts.push('text-decoration:line-through');
  if (props.color) parts.push(`color:#${props.color}`);
  if (props.fontSize) parts.push(`font-size:${props.fontSize}pt`);
  if (props.fontFamily) parts.push(`font-family:'${props.fontFamily}',sans-serif`);
  if (props.caps) parts.push('text-transform:uppercase');
  if (props.smallCaps) parts.push('font-variant:small-caps');
  return parts.join(';');
}

function paraPropsToCss(props) {
  const parts = [];
  if (props.textAlign) parts.push(`text-align:${props.textAlign}`);
  if (props.marginTop != null) parts.push(`margin-top:${props.marginTop}pt`);
  if (props.marginBottom != null) parts.push(`margin-bottom:${props.marginBottom}pt`);
  if (props.marginLeft) parts.push(`margin-left:${props.marginLeft}pt`);
  if (props.textIndent) parts.push(`text-indent:${props.textIndent}pt`);
  if (props.lineHeight) parts.push(`line-height:${props.lineHeight}`);
  if (props.borderBottom) parts.push(`border-bottom:${props.borderBottom}`);
  if (props.backgroundColor) parts.push(`background-color:${props.backgroundColor}`);
  return parts.join(';');
}

// ── Process a single run (w:r) ──────────────────────────────────────────────

function processRun(runEl, styleRunProps) {
  const rPr = findChild(runEl, 'w:rPr');
  const inlineProps = extractRunProps(rPr);
  const merged = mergeRunProps(styleRunProps, inlineProps);

  let text = '';

  if (!runEl.$$) return '';

  for (const child of runEl.$$) {
    const name = child['#name'];
    if (name === 'w:t') {
      text += getTextContent(child);
    } else if (name === 'w:br') {
      text += '<br/>';
    } else if (name === 'w:tab') {
      text += '&emsp;&emsp;';
    } else if (name === 'w:cr') {
      text += '<br/>';
    }
  }

  if (!text) return '';

  const css = runPropsToCss(merged);
  if (css) {
    return `<span style="${css}">${escapeHtml(text).replace(/<br\/>/g, '<br/>')}</span>`;
  }
  // Handle <br/> in escaped text
  return escapeHtml(text).replace(/&lt;br\/&gt;/g, '<br/>');
}

// ── Process a hyperlink (w:hyperlink) ───────────────────────────────────────

function processHyperlink(hlEl, styleRunProps, rels) {
  const rId = attr(hlEl, 'r:id');
  let href = '#';
  if (rId && rels[rId]) {
    href = rels[rId];
  }
  // Also check w:anchor
  const anchor = attr(hlEl, 'w:anchor');
  if (anchor) href = `#${anchor}`;

  let content = '';
  const runs = findChildren(hlEl, 'w:r');
  for (const r of runs) {
    content += processRun(r, styleRunProps);
  }

  return `<a href="${escapeHtml(href)}" style="color:#0563C1;text-decoration:underline">${content}</a>`;
}

// ── Process a paragraph (w:p) ───────────────────────────────────────────────

function processParagraph(pEl, styleMap, rels) {
  const pPr = findChild(pEl, 'w:pPr');
  const inlineParaProps = extractParaProps(pPr);
  const styleId = inlineParaProps.styleId;

  // Merge style + inline for paragraph
  const styleDef = styleId && styleMap[styleId] ? styleMap[styleId] : { runProps: {}, paraProps: {} };
  const paraProps = { ...styleDef.paraProps, ...inlineParaProps };
  const styleRunProps = styleDef.runProps || {};

  // Also check inline rPr on the paragraph level (default run props for this para)
  const paraRPr = pPr ? findChild(pPr, 'w:rPr') : null;
  const paraInlineRunProps = extractRunProps(paraRPr);
  const effectiveStyleRunProps = mergeRunProps(styleRunProps, paraInlineRunProps);

  const paraCss = paraPropsToCss(paraProps);

  // Check if empty paragraph
  if (!pEl.$$) {
    return `<p${paraCss ? ` style="${paraCss}"` : ''}>&nbsp;</p>\n`;
  }

  let content = '';
  let hasContent = false;

  for (const child of pEl.$$) {
    const name = child['#name'];
    if (name === 'w:r') {
      content += processRun(child, effectiveStyleRunProps);
      hasContent = true;
    } else if (name === 'w:hyperlink') {
      content += processHyperlink(child, effectiveStyleRunProps, rels);
      hasContent = true;
    }
  }

  if (!hasContent) {
    return `<p${paraCss ? ` style="${paraCss}"` : ''}>&nbsp;</p>\n`;
  }

  // Determine tag: use heading tags for heading styles
  let tag = 'p';
  if (styleId) {
    const sid = styleId.toLowerCase();
    if (sid.includes('heading1') || sid === 'heading1') tag = 'h1';
    else if (sid.includes('heading2') || sid === 'heading2') tag = 'h2';
    else if (sid.includes('heading3') || sid === 'heading3') tag = 'h3';
    else if (sid.includes('title')) tag = 'h1';
    else if (sid.includes('subtitle')) tag = 'h2';
  }

  // List items
  if (paraProps.isList) {
    const indent = (paraProps.listLevel || 0) * 20;
    return `<p style="${paraCss ? paraCss + ';' : ''}padding-left:${indent + 15}pt">• ${content}</p>\n`;
  }

  return `<${tag}${paraCss ? ` style="${paraCss}"` : ''}>${content}</${tag}>\n`;
}

// ── Process a table (w:tbl) ─────────────────────────────────────────────────

function processTable(tblEl, styleMap, rels) {
  if (!tblEl.$$) return '';

  // Table properties
  const tblPr = findChild(tblEl, 'w:tblPr');
  let tableStyle = 'width:100%;border-collapse:collapse;';

  // Table grid (column widths)
  const tblGrid = findChild(tblEl, 'w:tblGrid');
  const gridCols = tblGrid ? findChildren(tblGrid, 'w:gridCol') : [];
  const colWidths = gridCols.map(gc => {
    const w = attr(gc, 'w:w');
    return w ? parseInt(w) : 0;
  });
  const totalWidth = colWidths.reduce((a, b) => a + b, 0) || 1;

  // Check if it's a layout table (no borders) — common for resume column layouts
  let isLayoutTable = true; // assume layout table by default for resumes
  if (tblPr) {
    const tblBorders = findChild(tblPr, 'w:tblBorders');
    if (tblBorders) {
      const top = findChild(tblBorders, 'w:top');
      const left = findChild(tblBorders, 'w:left');
      if (top && attr(top, 'w:val') !== 'none' && attr(top, 'w:val') !== 'nil') {
        isLayoutTable = false;
      }
    }
  }

  let html = `<table style="${tableStyle}" cellpadding="0" cellspacing="0">\n`;

  // Rows
  const rows = findChildren(tblEl, 'w:tr');
  for (const row of rows) {
    html += '<tr>';

    const cells = findChildren(row, 'w:tc');
    let colIdx = 0;

    for (const cell of cells) {
      // Cell properties
      const tcPr = findChild(cell, 'w:tcPr');
      let cellStyle = 'vertical-align:top;';

      // Cell width
      const tcW = tcPr ? findChild(tcPr, 'w:tcW') : null;
      if (tcW) {
        const w = attr(tcW, 'w:w');
        const type = attr(tcW, 'w:type');
        if (w && totalWidth > 0) {
          const pct = Math.round((parseInt(w) / totalWidth) * 100);
          cellStyle += `width:${pct}%;`;
        }
      } else if (colWidths[colIdx]) {
        const pct = Math.round((colWidths[colIdx] / totalWidth) * 100);
        cellStyle += `width:${pct}%;`;
      }

      // Cell borders
      if (!isLayoutTable) {
        cellStyle += 'border:1px solid #ccc;';
      }

      // Cell padding
      cellStyle += 'padding:4pt 6pt;';

      // Cell shading / background
      const shd = tcPr ? findChild(tcPr, 'w:shd') : null;
      if (shd) {
        const fill = attr(shd, 'w:fill');
        if (fill && fill !== 'auto' && fill !== 'FFFFFF' && fill !== 'ffffff') {
          cellStyle += `background-color:#${fill};`;
        }
      }

      // Grid span
      const gridSpan = tcPr ? findChild(tcPr, 'w:gridSpan') : null;
      const span = gridSpan ? parseInt(attr(gridSpan, 'w:val') || '1') : 1;
      const colSpanAttr = span > 1 ? ` colspan="${span}"` : '';

      html += `<td style="${cellStyle}"${colSpanAttr}>`;

      // Cell content: paragraphs and nested tables
      if (cell.$$) {
        for (const child of cell.$$) {
          const name = child['#name'];
          if (name === 'w:p') {
            html += processParagraph(child, styleMap, rels);
          } else if (name === 'w:tbl') {
            html += processTable(child, styleMap, rels);
          }
        }
      }

      html += '</td>';
      colIdx += span;
    }

    html += '</tr>\n';
  }

  html += '</table>\n';
  return html;
}

// ── Parse relationships for hyperlinks ──────────────────────────────────────

async function parseRelationships(zip) {
  const rels = {};
  const relsFile = zip.file('word/_rels/document.xml.rels');
  if (!relsFile) return rels;

  const relsXml = await relsFile.async('string');
  const parser = new xml2js.Parser({ explicitArray: true, explicitChildren: true, preserveChildrenOrder: true });
  const relsTree = await parser.parseStringPromise(relsXml);

  const root = relsTree['Relationships'];
  if (!root?.$$) return rels;

  for (const child of root.$$) {
    if (child['#name'] === 'Relationship') {
      const id = attr(child, 'Id');
      const target = attr(child, 'Target');
      const type = attr(child, 'Type') || '';
      if (id && target && type.includes('hyperlink')) {
        rels[id] = target;
      }
    }
  }

  return rels;
}

// ── Main Export ──────────────────────────────────────────────────────────────

/**
 * Extract HTML from a DOCX buffer with all inline styles preserved.
 * Colors, fonts, sizes, bold, italic, tables, links — all kept.
 *
 * @param {Buffer} buffer – The raw DOCX file buffer
 * @returns {string|null} – Rich HTML string, or null if parsing fails
 */
async function extractDocxWithStyles(buffer) {
  try {
    const zip = await JSZip.loadAsync(buffer);

    // 1. Parse relationships (needed for hyperlinks)
    const rels = await parseRelationships(zip);

    // 2. Parse styles.xml
    const stylesXmlStr = await zip.file('word/styles.xml')?.async('string');
    const parser = new xml2js.Parser({
      explicitArray: true,
      explicitChildren: true,
      preserveChildrenOrder: true,
    });
    const stylesTree = stylesXmlStr ? await parser.parseStringPromise(stylesXmlStr) : null;
    const styleMap = buildStyleMap(stylesTree);

    // 3. Parse document.xml
    const docXmlStr = await zip.file('word/document.xml')?.async('string');
    if (!docXmlStr) return null;
    const docTree = await parser.parseStringPromise(docXmlStr);

    // Navigate to w:document > w:body
    const docRoot = docTree['w:document'];
    if (!docRoot) return null;
    const docEl = Array.isArray(docRoot) ? docRoot[0] : docRoot;
    const body = findChild(docEl, 'w:body');
    if (!body?.$$) return null;

    // 4. Process all body elements in order
    let html = '';
    for (const child of body.$$) {
      const name = child['#name'];
      if (name === 'w:p') {
        html += processParagraph(child, styleMap, rels);
      } else if (name === 'w:tbl') {
        html += processTable(child, styleMap, rels);
      }
      // w:sectPr — section properties, skip
    }

    // 5. Wrap in a container div with base styles
    const wrapper = `<div style="font-family:'Calibri','Segoe UI',sans-serif;font-size:11pt;color:#000;line-height:1.4;max-width:100%">${html}</div>`;

    return wrapper;
  } catch (err) {
    console.error('DOCX style extraction failed:', err.message);
    return null;
  }
}

module.exports = { extractDocxWithStyles };
