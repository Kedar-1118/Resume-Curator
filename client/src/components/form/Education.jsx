import { useState } from 'react';
import useResumeStore from '@/store/resumeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Education() {
  const education = useResumeStore((s) => s.resume.education);
  const addEducation = useResumeStore((s) => s.addEducation);
  const removeEducation = useResumeStore((s) => s.removeEducation);
  const updateEducation = useResumeStore((s) => s.updateEducation);

  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleRemove = (index) => {
    if (confirmDelete === index) {
      removeEducation(index);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(index);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Education</h3>
        <p className="text-xs text-slate-500">Add your degrees and certifications.</p>
      </div>

      {education.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-white/10 rounded-lg">
          No education added yet. Add your degrees and academic background.
        </div>
      )}

      {education.map((edu, i) => (
        <div key={i} className="p-4 rounded-lg border border-white/10 bg-white/[0.02] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Entry {i + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(i)}
              className="text-xs h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
            >
              {confirmDelete === i ? 'Confirm remove?' : '✕ Remove'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Degree</label>
              <Input
                placeholder="B.S. Computer Science"
                value={edu.degree}
                onChange={(e) => updateEducation(i, 'degree', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">School</label>
              <Input
                placeholder="Stanford University"
                value={edu.school}
                onChange={(e) => updateEducation(i, 'school', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Location</label>
              <Input
                placeholder="Stanford, CA"
                value={edu.location}
                onChange={(e) => updateEducation(i, 'location', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Year</label>
              <Input
                placeholder="2022"
                value={edu.year}
                onChange={(e) => updateEducation(i, 'year', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">GPA (optional)</label>
              <Input
                placeholder="3.8"
                value={edu.gpa}
                onChange={(e) => updateEducation(i, 'gpa', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-8 text-sm"
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        onClick={addEducation}
        variant="outline"
        className="w-full border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40 bg-transparent cursor-pointer"
      >
        + Add Education
      </Button>
    </div>
  );
}
