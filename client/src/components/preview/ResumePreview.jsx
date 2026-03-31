import useResumeStore from '@/store/resumeStore';
import ClassicTemplate from './ClassicTemplate';
import ModernTemplate from './ModernTemplate';
import ProfessionalTemplate from './ProfessionalTemplate';

const templateComponents = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  professional: ProfessionalTemplate,
};

export default function ResumePreview() {
  const resume = useResumeStore((s) => s.resume);
  const template = resume.template || 'modern';

  const TemplateComponent = templateComponents[template] || ModernTemplate;

  return (
    <div
      id="resume-preview"
      style={{
        width: '794px',
        height: '1123px',
        backgroundColor: '#fff',
        boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <TemplateComponent resume={resume} />
    </div>
  );
}
