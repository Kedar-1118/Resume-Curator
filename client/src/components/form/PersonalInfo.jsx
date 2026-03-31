import useResumeStore from '@/store/resumeStore';
import { Input } from '@/components/ui/input';

export default function PersonalInfo() {
  const personal = useResumeStore((s) => s.resume.personal);
  const updateField = useResumeStore((s) => s.updateField);

  const onChange = (field) => (e) => {
    updateField('personal', field, e.target.value);
  };

  const fields = [
    { key: 'name', label: 'Full Name', placeholder: 'John Doe', type: 'text' },
    { key: 'email', label: 'Email', placeholder: 'john@example.com', type: 'email' },
    { key: 'phone', label: 'Phone', placeholder: '+1 (555) 123-4567', type: 'tel' },
    { key: 'location', label: 'Location', placeholder: 'San Francisco, CA', type: 'text' },
    { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'linkedin.com/in/johndoe', type: 'url' },
    { key: 'github', label: 'GitHub URL', placeholder: 'github.com/johndoe', type: 'url' },
    { key: 'website', label: 'Website', placeholder: 'johndoe.dev', type: 'url' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Personal Information</h3>
        <p className="text-xs text-slate-500">Contact details that appear at the top of your resume.</p>
      </div>

      {fields.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <label htmlFor={`personal-${f.key}`} className="text-xs font-medium text-slate-400">
            {f.label}
          </label>
          <Input
            id={`personal-${f.key}`}
            type={f.type}
            placeholder={f.placeholder}
            value={personal[f.key] || ''}
            onChange={onChange(f.key)}
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500/50 h-9 text-sm"
          />
        </div>
      ))}
    </div>
  );
}
