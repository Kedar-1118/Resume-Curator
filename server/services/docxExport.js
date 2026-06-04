const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  TabStopPosition,
  TabStopType,
  BorderStyle,
  LevelFormat,
  convertInchesToTwip,
} = require('docx');

// Page width in DXA: A4 = 11906, minus 1-inch margins (1440 each side) = 9026
const PAGE_WIDTH = 11906;
const MARGIN = 1440;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

// Right tab stop at content width
const RIGHT_TAB = CONTENT_WIDTH;

/**
 * Generate a DOCX buffer from resume data.
 * No tables, no unicode bullets — uses LevelFormat.BULLET via numbering config.
 */
async function generateDOCX(resumeData) {
  const r = resumeData;
  const p = r.personal || {};
  const sections = [];

  // ─── Numbering config for bullet lists ─────────────────────
  const bulletNumbering = {
    config: [
      {
        reference: 'bullet-list',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '\u2022',
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.15) },
              },
            },
          },
        ],
      },
    ],
  };

  // ─── Name ──────────────────────────────────────────────────
  if (p.name) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: p.name,
            bold: true,
            size: 48, // 24pt
            font: 'Georgia',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      })
    );
  }

  // ─── Contact line ──────────────────────────────────────────
  const contactParts = [p.email, p.phone, p.location, p.linkedin, p.github, p.website].filter(Boolean);

  if (contactParts.length) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactParts.join(' | '),
            size: 20, // 10pt
            font: 'Georgia',
            color: '444444',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      })
    );
  }

  // ─── Horizontal rule ──────────────────────────────────────
  if (p.name || contactParts.length) {
    sections.push(
      new Paragraph({
        children: [],
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
        },
        spacing: { after: 200 },
      })
    );
  }

  // ─── Section heading helper ────────────────────────────────
  function sectionHeading(title) {
    return new Paragraph({
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 26, // 13pt
          font: 'Georgia',
        }),
      ],
      alignment: AlignmentType.CENTER,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'BBBBBB' },
      },
      spacing: { before: 80, after: 120 },
    });
  }

  // ─── Summary ──────────────────────────────────────────────
  if (r.summary) {
    sections.push(sectionHeading('Summary'));
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: r.summary,
            size: 22, // 11pt
            font: 'Georgia',
          }),
        ],
        spacing: { after: 160 },
      })
    );
  }

  // ─── Experience ───────────────────────────────────────────
  if (r.experience?.length) {
    sections.push(sectionHeading('Experience'));

    r.experience.forEach((exp) => {
      const dateStr = [exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' \u2013 ');

      // Title + date on same line with right-aligned tab
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.title || '',
              bold: true,
              size: 22,
              font: 'Georgia',
            }),
            new TextRun({
              text: '\t',
            }),
            new TextRun({
              text: dateStr,
              size: 22,
              font: 'Georgia',
              color: '555555',
            }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
          spacing: { before: 40, after: 20 },
        })
      );

      // Company, Location
      const sub = [exp.company, exp.location].filter(Boolean).join(', ');
      if (sub) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: sub,
                italics: true,
                size: 22,
                font: 'Georgia',
                color: '444444',
              }),
            ],
            spacing: { after: 40 },
          })
        );
      }

      // Bullets
      const bullets = (exp.bullets || []).filter(Boolean);
      bullets.forEach((bullet) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: bullet,
                size: 22,
                font: 'Georgia',
              }),
            ],
            numbering: { reference: 'bullet-list', level: 0 },
            spacing: { after: 20 },
          })
        );
      });
    });
  }

  // ─── Education ────────────────────────────────────────────
  if (r.education?.length) {
    sections.push(sectionHeading('Education'));

    r.education.forEach((edu) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree || '',
              bold: true,
              size: 22,
              font: 'Georgia',
            }),
            new TextRun({ text: '\t' }),
            new TextRun({
              text: edu.year || '',
              size: 22,
              font: 'Georgia',
              color: '555555',
            }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
          spacing: { before: 40, after: 20 },
        })
      );

      const sub = [edu.school, edu.location].filter(Boolean).join(', ');
      const gpaText = edu.gpa ? ` \u2014 GPA: ${edu.gpa}` : '';
      if (sub || gpaText) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: sub + gpaText,
                italics: true,
                size: 22,
                font: 'Georgia',
                color: '444444',
              }),
            ],
            spacing: { after: 60 },
          })
        );
      }
    });
  }

  // ─── Projects ─────────────────────────────────────────────
  if (r.projects?.length) {
    sections.push(sectionHeading('Projects'));

    r.projects.forEach((proj) => {
      // Project name + technologies
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: proj.name || '',
              bold: true,
              size: 22,
              font: 'Georgia',
            }),
            ...(proj.technologies ? [
              new TextRun({ text: '\t' }),
              new TextRun({
                text: proj.technologies,
                size: 22,
                font: 'Georgia',
                color: '555555',
              }),
            ] : []),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
          spacing: { before: 40, after: 20 },
        })
      );

      // Description + link
      const desc = [proj.description, proj.link].filter(Boolean).join(' | ');
      if (desc) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: desc,
                italics: true,
                size: 22,
                font: 'Georgia',
                color: '444444',
              }),
            ],
            spacing: { after: 40 },
          })
        );
      }

      // Bullets
      const bullets = (proj.bullets || []).filter(Boolean);
      bullets.forEach((bullet) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: bullet,
                size: 22,
                font: 'Georgia',
              }),
            ],
            numbering: { reference: 'bullet-list', level: 0 },
            spacing: { after: 20 },
          })
        );
      });
    });
  }

  // ─── Skills ───────────────────────────────────────────────
  if (r.skills?.length) {
    sections.push(sectionHeading('Skills'));
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: r.skills.join(', '),
            size: 22,
            font: 'Georgia',
          }),
        ],
        spacing: { after: 160 },
      })
    );
  }

  // ─── Certifications ───────────────────────────────────────
  const certs = (r.certifications || []).filter(Boolean);
  if (certs.length) {
    sections.push(sectionHeading('Certifications'));
    certs.forEach((cert) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cert,
              size: 22,
              font: 'Georgia',
            }),
          ],
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 20 },
        })
      );
    });
  }

  // ─── Build document ───────────────────────────────────────
  const doc = new Document({
    numbering: bulletNumbering,
    sections: [
      {
        properties: {
          page: {
            size: {
              width: PAGE_WIDTH,
              height: 16838,
            },
            margin: {
              top: MARGIN,
              right: MARGIN,
              bottom: MARGIN,
              left: MARGIN,
            },
          },
        },
        children: sections,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

/**
 * Generate a cover letter DOCX buffer from cover letter JSON.
 * Clean, professional format — no tables, standard margins.
 */
async function generateCoverLetterDOCX(coverLetter, personal = {}) {
  const sections = [];

  // ─── Candidate name + date ─────────────────────────────────
  if (personal.name) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: personal.name,
            bold: true,
            size: 28, // 14pt
            font: 'Georgia',
          }),
        ],
        spacing: { after: 40 },
      })
    );
  }

  // Contact info
  const contactParts = [personal.email, personal.phone, personal.location].filter(Boolean);
  if (contactParts.length) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactParts.join(' | '),
            size: 20,
            font: 'Georgia',
            color: '444444',
          }),
        ],
        spacing: { after: 80 },
      })
    );
  }

  // Date
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          size: 22,
          font: 'Georgia',
          color: '555555',
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // ─── Subject line ──────────────────────────────────────────
  if (coverLetter.subject) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: coverLetter.subject,
            bold: true,
            size: 22,
            font: 'Georgia',
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // ─── Salutation ────────────────────────────────────────────
  if (coverLetter.salutation) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: coverLetter.salutation,
            size: 22,
            font: 'Georgia',
          }),
        ],
        spacing: { after: 160 },
      })
    );
  }

  // ─── Opening paragraph ────────────────────────────────────
  if (coverLetter.opening) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: coverLetter.opening,
            size: 22,
            font: 'Georgia',
          }),
        ],
        spacing: { after: 160 },
      })
    );
  }

  // ─── Body paragraphs ──────────────────────────────────────
  if (coverLetter.bodyParagraphs?.length) {
    coverLetter.bodyParagraphs.forEach((para) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: para,
              size: 22,
              font: 'Georgia',
            }),
          ],
          spacing: { after: 160 },
        })
      );
    });
  }

  // ─── Closing ───────────────────────────────────────────────
  if (coverLetter.closing) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: coverLetter.closing,
            size: 22,
            font: 'Georgia',
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // Signature
  if (personal.name) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: personal.name,
            bold: true,
            size: 22,
            font: 'Georgia',
          }),
        ],
        spacing: { before: 100 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: 16838 },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        children: sections,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

module.exports = { generateDOCX, generateCoverLetterDOCX };
