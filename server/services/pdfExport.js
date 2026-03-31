const puppeteer = require('puppeteer');

/**
 * Generate a PDF buffer from resume data using a specific template.
 * The HTML is fully self-contained with inline CSS — no external resources.
 */
async function generatePDF(resumeData, template = 'modern') {
  const builders = {
    classic: buildClassicHTML,
    modern: buildModernHTML,
    professional: buildProfessionalHTML,
  };

  const buildHTML = builders[template] || builders.modern;
  const html = buildHTML(resumeData);

  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return pdfBuffer;
  } finally {
    if (browser) await browser.close();
  }
}

// ═══════════════════════════════════════════════════════════════
// Shared helpers
// ═══════════════════════════════════════════════════════════════

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function contactParts(personal) {
  return [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin,
    personal.github,
    personal.website,
  ].filter(Boolean);
}

function has(section) {
  if (Array.isArray(section)) return section.length > 0;
  return !!section;
}

function dateRange(exp) {
  return [exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' \u2013 ');
}

// ═══════════════════════════════════════════════════════════════
// CLASSIC TEMPLATE
// ═══════════════════════════════════════════════════════════════

function buildClassicHTML(r) {
  const p = r.personal || {};
  const cp = contactParts(p);

  let html = '';

  // Name
  if (p.name) {
    html += `<div style="text-align:center;font-size:24px;font-weight:700;letter-spacing:0.5px;margin-bottom:4px;">${esc(p.name)}</div>`;
  }

  // Contact
  if (cp.length) {
    html += `<div style="text-align:center;font-size:11px;color:#444;margin-bottom:12px;">${cp.map(esc).join(' | ')}</div>`;
  }

  if (p.name || cp.length) {
    html += `<hr style="border:none;border-top:1px solid #999;margin:0 0 14px 0;">`;
  }

  // Section heading helper
  const sectionHead = (title) =>
    `<div style="text-align:center;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">${title}</div>
     <hr style="border:none;border-top:1px solid #bbb;margin:0 0 8px 0;">`;

  // Summary
  if (has(r.summary)) {
    html += `<div style="margin-bottom:14px;">${sectionHead('Summary')}
      <div style="font-size:11px;line-height:1.6;color:#222;">${esc(r.summary)}</div></div>`;
  }

  // Experience
  if (has(r.experience)) {
    html += `<div style="margin-bottom:14px;">${sectionHead('Experience')}`;
    r.experience.forEach((exp) => {
      html += `<div style="margin-bottom:10px;page-break-inside:avoid;">`;
      html += `<div style="display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-weight:700;font-size:11px;">${esc(exp.title)}</span>
        <span style="font-size:11px;color:#555;flex-shrink:0;margin-left:8px;">${esc(dateRange(exp))}</span></div>`;
      const sub = [exp.company, exp.location].filter(Boolean);
      if (sub.length) {
        html += `<div style="font-size:11px;font-style:italic;color:#444;margin-top:1px;">${sub.map(esc).join(', ')}</div>`;
      }
      const bullets = (exp.bullets || []).filter(Boolean);
      if (bullets.length) {
        html += `<div style="margin-top:4px;">`;
        bullets.forEach((b) => {
          html += `<div style="margin-left:16px;font-size:11px;line-height:1.6;color:#222;margin-bottom:2px;">\u2014 ${esc(b)}</div>`;
        });
        html += `</div>`;
      }
      html += `</div>`;
    });
    html += `</div>`;
  }

  // Education
  if (has(r.education)) {
    html += `<div style="margin-bottom:14px;">${sectionHead('Education')}`;
    r.education.forEach((edu) => {
      html += `<div style="margin-bottom:6px;page-break-inside:avoid;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <span style="font-weight:700;font-size:11px;">${esc(edu.degree)}</span>
          <span style="font-size:11px;color:#555;flex-shrink:0;margin-left:8px;">${esc(edu.year)}</span></div>
        <div style="font-size:11px;font-style:italic;color:#444;">
          ${[edu.school, edu.location].filter(Boolean).map(esc).join(', ')}${edu.gpa ? ` \u2014 GPA: ${esc(edu.gpa)}` : ''}</div></div>`;
    });
    html += `</div>`;
  }

  // Skills
  if (has(r.skills)) {
    html += `<div style="margin-bottom:14px;">${sectionHead('Skills')}
      <div style="font-size:11px;color:#222;line-height:1.6;">${r.skills.map(esc).join(', ')}</div></div>`;
  }

  // Certifications
  const certs = (r.certifications || []).filter(Boolean);
  if (certs.length) {
    html += `<div style="margin-bottom:14px;">${sectionHead('Certifications')}`;
    certs.forEach((c) => {
      html += `<div style="font-size:11px;color:#222;margin-bottom:2px;">\u2014 ${esc(c)}</div>`;
    });
    html += `</div>`;
  }

  return wrapHTML(html, 'Georgia, "Times New Roman", serif', '11px', '1.5', '48px 52px');
}

// ═══════════════════════════════════════════════════════════════
// MODERN TEMPLATE
// ═══════════════════════════════════════════════════════════════

function buildModernHTML(r) {
  const p = r.personal || {};
  const cp = contactParts(p);

  let html = '';

  // Name
  if (p.name) {
    html += `<div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;margin-bottom:4px;">${esc(p.name)}</div>`;
  }

  // Contact
  if (cp.length) {
    html += `<div style="font-size:11px;color:#555;margin-bottom:16px;">${cp.map(esc).join('  \u2022  ')}</div>`;
  }

  const sectionHead = (title) =>
    `<div style="border-left:3px solid #000;padding-left:8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">${title}</div>`;

  // Summary
  if (has(r.summary)) {
    html += `<div style="margin-bottom:16px;">${sectionHead('Summary')}
      <div style="font-size:11px;line-height:1.6;color:#222;">${esc(r.summary)}</div></div>`;
  }

  // Experience
  if (has(r.experience)) {
    html += `<div style="margin-bottom:16px;">${sectionHead('Experience')}`;
    r.experience.forEach((exp) => {
      html += `<div style="margin-bottom:12px;page-break-inside:avoid;">`;
      html += `<div style="display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-weight:700;font-size:12px;">${esc(exp.title)}</span>
        <span style="font-size:11px;color:#666;flex-shrink:0;margin-left:8px;">${esc(dateRange(exp))}</span></div>`;
      const sub = [exp.company, exp.location].filter(Boolean);
      if (sub.length) {
        html += `<div style="font-size:11px;color:#555;margin-top:1px;">${sub.map(esc).join(' \u2022 ')}</div>`;
      }
      const bullets = (exp.bullets || []).filter(Boolean);
      if (bullets.length) {
        html += `<div style="margin-top:4px;">`;
        bullets.forEach((b) => {
          html += `<div style="margin-left:14px;font-size:11px;line-height:1.5;color:#222;margin-bottom:2px;">\u2022 ${esc(b)}</div>`;
        });
        html += `</div>`;
      }
      html += `</div>`;
    });
    html += `</div>`;
  }

  // Education
  if (has(r.education)) {
    html += `<div style="margin-bottom:16px;">${sectionHead('Education')}`;
    r.education.forEach((edu) => {
      html += `<div style="margin-bottom:8px;page-break-inside:avoid;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <span style="font-weight:700;font-size:12px;">${esc(edu.degree)}</span>
          <span style="font-size:11px;color:#666;flex-shrink:0;margin-left:8px;">${esc(edu.year)}</span></div>
        <div style="font-size:11px;color:#555;">
          ${[edu.school, edu.location].filter(Boolean).map(esc).join(' \u2022 ')}${edu.gpa ? ` \u2014 GPA: ${esc(edu.gpa)}` : ''}</div></div>`;
    });
    html += `</div>`;
  }

  // Skills
  if (has(r.skills)) {
    html += `<div style="margin-bottom:16px;">${sectionHead('Skills')}
      <div style="font-size:11px;color:#222;line-height:1.6;">${r.skills.map(esc).join('  \u2022  ')}</div></div>`;
  }

  // Certifications
  const certs = (r.certifications || []).filter(Boolean);
  if (certs.length) {
    html += `<div style="margin-bottom:16px;">${sectionHead('Certifications')}`;
    certs.forEach((c) => {
      html += `<div style="font-size:11px;color:#222;margin-bottom:2px;">\u2022 ${esc(c)}</div>`;
    });
    html += `</div>`;
  }

  return wrapHTML(html, '"DM Sans", "Inter", "Helvetica Neue", Arial, sans-serif', '11px', '1.5', '40px 44px');
}

// ═══════════════════════════════════════════════════════════════
// PROFESSIONAL TEMPLATE
// ═══════════════════════════════════════════════════════════════

function buildProfessionalHTML(r) {
  const p = r.personal || {};
  const cp = contactParts(p);

  let html = '';

  // Name
  if (p.name) {
    html += `<div style="font-size:20px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">${esc(p.name)}</div>`;
    html += `<div style="border-bottom:3px double #000;margin-bottom:6px;padding-bottom:2px;"></div>`;
  }

  // Contact
  if (cp.length) {
    html += `<div style="font-size:10px;color:#333;margin-bottom:10px;">${cp.map(esc).join(' | ')}</div>`;
  }

  const sectionHead = (title) =>
    `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:6px;">${title}</div>`;

  // Summary
  if (has(r.summary)) {
    html += `<div style="margin-bottom:10px;">${sectionHead('Summary')}
      <div style="font-size:10px;line-height:1.4;color:#111;">${esc(r.summary)}</div></div>`;
  }

  // Experience
  if (has(r.experience)) {
    html += `<div style="margin-bottom:10px;">${sectionHead('Experience')}`;
    r.experience.forEach((exp) => {
      html += `<div style="margin-bottom:8px;page-break-inside:avoid;">`;
      html += `<div style="display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-weight:700;font-size:11px;">${esc(exp.title)}</span>
        <span style="font-size:10px;color:#444;flex-shrink:0;margin-left:8px;">${esc(dateRange(exp))}</span></div>`;
      html += `<div style="display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-size:10px;font-style:italic;color:#333;">${esc(exp.company)}</span>`;
      if (exp.location) {
        html += `<span style="font-size:10px;color:#555;flex-shrink:0;margin-left:8px;">${esc(exp.location)}</span>`;
      }
      html += `</div>`;
      const bullets = (exp.bullets || []).filter(Boolean);
      if (bullets.length) {
        html += `<div style="margin-top:3px;">`;
        bullets.forEach((b) => {
          html += `<div style="margin-left:12px;font-size:10px;line-height:1.4;color:#111;margin-bottom:1px;">\u203A ${esc(b)}</div>`;
        });
        html += `</div>`;
      }
      html += `</div>`;
    });
    html += `</div>`;
  }

  // Education
  if (has(r.education)) {
    html += `<div style="margin-bottom:10px;">${sectionHead('Education')}`;
    r.education.forEach((edu) => {
      html += `<div style="margin-bottom:6px;page-break-inside:avoid;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <span style="font-weight:700;font-size:11px;">${esc(edu.degree)}</span>
          <span style="font-size:10px;color:#444;flex-shrink:0;margin-left:8px;">${esc(edu.year)}</span></div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <span style="font-size:10px;font-style:italic;color:#333;">${esc(edu.school)}</span>`;
      if (edu.location) {
        html += `<span style="font-size:10px;color:#555;flex-shrink:0;margin-left:8px;">${esc(edu.location)}</span>`;
      }
      html += `</div>`;
      if (edu.gpa) {
        html += `<div style="font-size:10px;color:#444;">GPA: ${esc(edu.gpa)}</div>`;
      }
      html += `</div>`;
    });
    html += `</div>`;
  }

  // Skills
  if (has(r.skills)) {
    html += `<div style="margin-bottom:10px;">${sectionHead('Skills')}
      <div style="font-size:10px;color:#111;line-height:1.4;">${r.skills.map(esc).join('  \u2022  ')}</div></div>`;
  }

  // Certifications
  const certs = (r.certifications || []).filter(Boolean);
  if (certs.length) {
    html += `<div style="margin-bottom:10px;">${sectionHead('Certifications')}`;
    certs.forEach((c) => {
      html += `<div style="font-size:10px;color:#111;margin-bottom:1px;">\u203A ${esc(c)}</div>`;
    });
    html += `</div>`;
  }

  return wrapHTML(html, '"Times New Roman", Times, Georgia, serif', '10px', '1.4', '36px 40px');
}

// ═══════════════════════════════════════════════════════════════
// HTML wrapper — self-contained with fonts & print rules
// ═══════════════════════════════════════════════════════════════

function wrapHTML(bodyContent, fontFamily, fontSize, lineHeight, padding) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=Inter:wght@400;500;700&display=swap');

  @page {
    size: A4;
    margin: 0;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    width: 210mm;
    height: 297mm;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: ${fontFamily};
    font-size: ${fontSize};
    line-height: ${lineHeight};
    color: #000;
    background: #fff;
    word-break: break-word;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .resume-body {
    padding: ${padding};
  }

  hr {
    border: none;
    page-break-after: avoid;
  }
</style>
</head>
<body>
<div class="resume-body">
${bodyContent}
</div>
</body>
</html>`;
}

module.exports = { generatePDF };
