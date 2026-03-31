import useResumeStore from '@/store/resumeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Certifications() {
  const certifications = useResumeStore((s) => s.resume.certifications);
  const updateField = useResumeStore((s) => s.updateField);

  const addCert = () => {
    updateField('certifications', null, [...certifications, '']);
  };

  const removeCert = (index) => {
    updateField('certifications', null, certifications.filter((_, i) => i !== index));
  };

  const updateCert = (index, value) => {
    const updated = [...certifications];
    updated[index] = value;
    updateField('certifications', null, updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Certifications</h3>
        <p className="text-xs text-slate-500">Professional certifications and licenses.</p>
      </div>

      {certifications.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-white/10 rounded-lg">
          No certifications added yet.
        </div>
      )}

      {certifications.map((cert, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            placeholder="AWS Solutions Architect, PMP, etc."
            value={cert}
            onChange={(e) => updateCert(i, e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-8 text-sm flex-1"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeCert(i)}
            className="text-xs h-8 px-2 text-red-400 hover:text-red-300 shrink-0 cursor-pointer"
          >
            ✕
          </Button>
        </div>
      ))}

      <Button
        onClick={addCert}
        variant="outline"
        className="w-full border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40 bg-transparent cursor-pointer"
      >
        + Add Certification
      </Button>
    </div>
  );
}
