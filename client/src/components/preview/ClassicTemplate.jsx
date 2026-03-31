export default function ClassicTemplate({ resume }) {
  const { personal, summary, experience, education, projects, skills, certifications } = resume;

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

  return (
    <div style={{
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '11px',
      lineHeight: '1.5',
      color: '#000',
      padding: '48px 52px',
      wordBreak: 'break-word',
    }}>
      {/* Name */}
      {personal.name && (
        <div style={{
          textAlign: 'center',
          fontSize: '24px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          marginBottom: '4px',
        }}>
          {personal.name}
        </div>
      )}

      {/* Contact Line */}
      {contactParts.length > 0 && (
        <div style={{
          textAlign: 'center',
          fontSize: '11px',
          color: '#444',
          marginBottom: '12px',
        }}>
          {contactParts.join(' | ')}
        </div>
      )}

      {(personal.name || contactParts.length > 0) && (
        <hr style={{ border: 'none', borderTop: '1px solid #999', margin: '0 0 14px 0' }} />
      )}

      {/* Summary */}
      {hasContent(summary) && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '4px',
          }}>
            Summary
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #bbb', margin: '0 0 8px 0' }} />
          <div style={{ fontSize: '11px', lineHeight: '1.6', color: '#222' }}>
            {summary}
          </div>
        </div>
      )}

      {/* Experience */}
      {hasContent(experience) && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '4px',
          }}>
            Experience
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #bbb', margin: '0 0 8px 0' }} />

          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px', pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: '11px' }}>{exp.title}</span>
                <span style={{ fontSize: '11px', color: '#555', flexShrink: 0, marginLeft: '8px' }}>
                  {[exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' – ')}
                </span>
              </div>
              {(exp.company || exp.location) && (
                <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#444', marginTop: '1px' }}>
                  {[exp.company, exp.location].filter(Boolean).join(', ')}
                </div>
              )}
              {exp.bullets?.filter(Boolean).length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  {exp.bullets.filter(Boolean).map((bullet, bi) => (
                    <div key={bi} style={{
                      marginLeft: '16px',
                      fontSize: '11px',
                      lineHeight: '1.6',
                      color: '#222',
                      marginBottom: '2px',
                    }}>
                      — {bullet}
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
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '4px',
          }}>
            Education
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #bbb', margin: '0 0 8px 0' }} />

          {education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px', pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: '11px' }}>{edu.degree}</span>
                <span style={{ fontSize: '11px', color: '#555', flexShrink: 0, marginLeft: '8px' }}>
                  {edu.year}
                </span>
              </div>
              <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#444' }}>
                {[edu.school, edu.location].filter(Boolean).join(', ')}
                {edu.gpa ? ` — GPA: ${edu.gpa}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {hasContent(projects) && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '4px',
          }}>
            Projects
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #bbb', margin: '0 0 8px 0' }} />

          {projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: '10px', pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: '11px' }}>{proj.name}</span>
                {proj.technologies && (
                  <span style={{ fontSize: '11px', color: '#555', flexShrink: 0, marginLeft: '8px' }}>
                    {proj.technologies}
                  </span>
                )}
              </div>
              {proj.description && (
                <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#444', marginTop: '1px' }}>
                  {proj.description}
                  {proj.link && ` | ${proj.link}`}
                </div>
              )}
              {proj.bullets?.filter(Boolean).length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  {proj.bullets.filter(Boolean).map((bullet, bi) => (
                    <div key={bi} style={{
                      marginLeft: '16px',
                      fontSize: '11px',
                      lineHeight: '1.6',
                      color: '#222',
                      marginBottom: '2px',
                    }}>
                      — {bullet}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {hasContent(skills) && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '4px',
          }}>
            Skills
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #bbb', margin: '0 0 8px 0' }} />
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '5px',
            justifyContent: 'center',
          }}>
            {skills.map((skill, i) => (
              <span key={i} style={{
                fontSize: '10px',
                color: '#222',
                border: '1px solid #ccc',
                padding: '2px 8px',
                borderRadius: '3px',
                lineHeight: '1.6',
              }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {hasContent(certifications) && certifications.some(Boolean) && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '4px',
          }}>
            Certifications
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #bbb', margin: '0 0 8px 0' }} />
          {certifications.filter(Boolean).map((cert, i) => (
            <div key={i} style={{ fontSize: '11px', color: '#222', marginBottom: '2px' }}>
              — {cert}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
