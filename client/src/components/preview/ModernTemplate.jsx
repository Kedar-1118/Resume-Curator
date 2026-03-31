export default function ModernTemplate({ resume }) {
  const { personal, summary, experience, education, skills, certifications } = resume;

  const hasContent = (section) => {
    if (Array.isArray(section)) return section.length > 0;
    return !!section;
  };

  const contactParts = [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin,
    personal.github,
    personal.website,
  ].filter(Boolean);

  const sectionHeadingStyle = {
    borderLeft: '3px solid #000',
    paddingLeft: '8px',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  };

  return (
    <div style={{
      fontFamily: '"DM Sans", "Inter", "Helvetica Neue", Arial, sans-serif',
      fontSize: '11px',
      lineHeight: '1.5',
      color: '#000',
      padding: '40px 44px',
      wordBreak: 'break-word',
    }}>
      {/* Name */}
      {personal.name && (
        <div style={{
          fontSize: '26px',
          fontWeight: 800,
          letterSpacing: '-0.5px',
          marginBottom: '4px',
        }}>
          {personal.name}
        </div>
      )}

      {/* Contact Line */}
      {contactParts.length > 0 && (
        <div style={{
          fontSize: '11px',
          color: '#555',
          marginBottom: '16px',
        }}>
          {contactParts.join('  •  ')}
        </div>
      )}

      {/* Summary */}
      {hasContent(summary) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={sectionHeadingStyle}>Summary</div>
          <div style={{ fontSize: '11px', lineHeight: '1.6', color: '#222' }}>
            {summary}
          </div>
        </div>
      )}

      {/* Experience */}
      {hasContent(experience) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={sectionHeadingStyle}>Experience</div>

          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: '12px' }}>{exp.title}</span>
                <span style={{ fontSize: '11px', color: '#666', flexShrink: 0, marginLeft: '8px' }}>
                  {[exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' – ')}
                </span>
              </div>
              {(exp.company || exp.location) && (
                <div style={{ fontSize: '11px', color: '#555', marginTop: '1px' }}>
                  {[exp.company, exp.location].filter(Boolean).join(' • ')}
                </div>
              )}
              {exp.bullets?.filter(Boolean).length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  {exp.bullets.filter(Boolean).map((bullet, bi) => (
                    <div key={bi} style={{
                      marginLeft: '14px',
                      fontSize: '11px',
                      lineHeight: '1.5',
                      color: '#222',
                      marginBottom: '2px',
                    }}>
                      • {bullet}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {hasContent(education) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={sectionHeadingStyle}>Education</div>

          {education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '8px', pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: '12px' }}>{edu.degree}</span>
                <span style={{ fontSize: '11px', color: '#666', flexShrink: 0, marginLeft: '8px' }}>
                  {edu.year}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#555' }}>
                {[edu.school, edu.location].filter(Boolean).join(' • ')}
                {edu.gpa ? ` — GPA: ${edu.gpa}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {hasContent(skills) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={sectionHeadingStyle}>Skills</div>
          <div style={{
            fontSize: '11px',
            color: '#222',
            lineHeight: '1.6',
          }}>
            {skills.join('  •  ')}
          </div>
        </div>
      )}

      {/* Certifications */}
      {hasContent(certifications) && certifications.some(Boolean) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={sectionHeadingStyle}>Certifications</div>
          {certifications.filter(Boolean).map((cert, i) => (
            <div key={i} style={{ fontSize: '11px', color: '#222', marginBottom: '2px' }}>
              • {cert}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
