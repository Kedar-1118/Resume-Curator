export default function ProfessionalTemplate({ resume }) {
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

  const sectionHeadingStyle = {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #000',
    paddingBottom: '2px',
    marginBottom: '6px',
  };

  return (
    <div style={{
      fontFamily: '"Times New Roman", Times, Georgia, serif',
      fontSize: '10px',
      lineHeight: '1.4',
      color: '#000',
      padding: '36px 40px',
      wordBreak: 'break-word',
    }}>
      {/* Name */}
      {personal.name && (
        <div style={{
          fontSize: '20px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '2px',
        }}>
          {personal.name}
        </div>
      )}

      {/* Double rule under name */}
      {personal.name && (
        <div style={{
          borderBottom: '3px double #000',
          marginBottom: '6px',
          paddingBottom: '2px',
        }} />
      )}

      {/* Contact */}
      {contactParts.length > 0 && (
        <div style={{
          fontSize: '10px',
          color: '#333',
          marginBottom: '10px',
        }}>
          {contactParts.join(' | ')}
        </div>
      )}

      {/* Summary */}
      {hasContent(summary) && (
        <div style={{ marginBottom: '10px' }}>
          <div style={sectionHeadingStyle}>Summary</div>
          <div style={{ fontSize: '10px', lineHeight: '1.4', color: '#111' }}>
            {summary}
          </div>
        </div>
      )}

      {/* Experience */}
      {hasContent(experience) && (
        <div style={{ marginBottom: '10px' }}>
          <div style={sectionHeadingStyle}>Experience</div>

          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '8px', pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: '11px' }}>
                  {exp.title}
                </span>
                <span style={{ fontSize: '10px', color: '#444', flexShrink: 0, marginLeft: '8px' }}>
                  {[exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' – ')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '10px', fontStyle: 'italic', color: '#333' }}>
                  {exp.company}
                </span>
                {exp.location && (
                  <span style={{ fontSize: '10px', color: '#555', flexShrink: 0, marginLeft: '8px' }}>
                    {exp.location}
                  </span>
                )}
              </div>
              {exp.bullets?.filter(Boolean).length > 0 && (
                <div style={{ marginTop: '3px' }}>
                  {exp.bullets.filter(Boolean).map((bullet, bi) => (
                    <div key={bi} style={{
                      marginLeft: '12px',
                      fontSize: '10px',
                      lineHeight: '1.4',
                      color: '#111',
                      marginBottom: '1px',
                    }}>
                      › {bullet}
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
        <div style={{ marginBottom: '10px' }}>
          <div style={sectionHeadingStyle}>Education</div>

          {education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px', pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: '11px' }}>{edu.degree}</span>
                <span style={{ fontSize: '10px', color: '#444', flexShrink: 0, marginLeft: '8px' }}>
                  {edu.year}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '10px', fontStyle: 'italic', color: '#333' }}>{edu.school}</span>
                {edu.location && (
                  <span style={{ fontSize: '10px', color: '#555', flexShrink: 0, marginLeft: '8px' }}>
                    {edu.location}
                  </span>
                )}
              </div>
              {edu.gpa && (
                <div style={{ fontSize: '10px', color: '#444' }}>GPA: {edu.gpa}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {hasContent(projects) && (
        <div style={{ marginBottom: '10px' }}>
          <div style={sectionHeadingStyle}>Projects</div>

          {projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: '8px', pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: '11px' }}>{proj.name}</span>
                {proj.technologies && (
                  <span style={{ fontSize: '10px', color: '#444', flexShrink: 0, marginLeft: '8px' }}>
                    {proj.technologies}
                  </span>
                )}
              </div>
              {proj.description && (
                <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#333' }}>
                  {proj.description}
                  {proj.link && ` | ${proj.link}`}
                </div>
              )}
              {proj.bullets?.filter(Boolean).length > 0 && (
                <div style={{ marginTop: '3px' }}>
                  {proj.bullets.filter(Boolean).map((bullet, bi) => (
                    <div key={bi} style={{
                      marginLeft: '12px',
                      fontSize: '10px',
                      lineHeight: '1.4',
                      color: '#111',
                      marginBottom: '1px',
                    }}>
                      › {bullet}
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
        <div style={{ marginBottom: '10px' }}>
          <div style={sectionHeadingStyle}>Skills</div>
          <div style={{
            fontSize: '10px',
            color: '#111',
            lineHeight: '1.4',
          }}>
            {skills.join('  •  ')}
          </div>
        </div>
      )}

      {/* Certifications */}
      {hasContent(certifications) && certifications.some(Boolean) && (
        <div style={{ marginBottom: '10px' }}>
          <div style={sectionHeadingStyle}>Certifications</div>
          {certifications.filter(Boolean).map((cert, i) => (
            <div key={i} style={{ fontSize: '10px', color: '#111', marginBottom: '1px' }}>
              › {cert}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
