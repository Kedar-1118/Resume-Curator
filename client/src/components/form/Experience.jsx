import { useState } from 'react';
import useResumeStore from '@/store/resumeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import BulletRewriter from '@/components/ai/BulletRewriter';

export default function Experience() {
  const experience = useResumeStore((s) => s.resume.experience);
  const targetJD = useResumeStore((s) => s.resume.targetJD);
  const addExperience = useResumeStore((s) => s.addExperience);
  const removeExperience = useResumeStore((s) => s.removeExperience);
  const updateExperience = useResumeStore((s) => s.updateExperience);
  const addBullet = useResumeStore((s) => s.addBullet);
  const removeBullet = useResumeStore((s) => s.removeBullet);
  const updateBullet = useResumeStore((s) => s.updateBullet);

  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleRemoveExperience = (index) => {
    if (confirmDelete === index) {
      removeExperience(index);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(index);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Work Experience</h3>
        <p className="text-xs text-slate-500">Add your roles, starting with the most recent.</p>
      </div>

      {experience.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-white/10 rounded-lg">
          No experience added yet. Add your first role.
        </div>
      )}

      {experience.map((exp, i) => (
        <div key={i} className="p-4 rounded-lg border border-white/10 bg-white/[0.02] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Position {i + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveExperience(i)}
              className="text-xs h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
            >
              {confirmDelete === i ? 'Confirm remove?' : '✕ Remove'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Job Title</label>
              <Input
                placeholder="Software Engineer"
                value={exp.title}
                onChange={(e) => updateExperience(i, 'title', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Company</label>
              <Input
                placeholder="Google"
                value={exp.company}
                onChange={(e) => updateExperience(i, 'company', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Location</label>
              <Input
                placeholder="Mountain View, CA"
                value={exp.location}
                onChange={(e) => updateExperience(i, 'location', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Start Date</label>
              <Input
                placeholder="Jan 2022"
                value={exp.startDate}
                onChange={(e) => updateExperience(i, 'startDate', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">End Date</label>
              <Input
                placeholder="Present"
                value={exp.current ? 'Present' : exp.endDate}
                disabled={exp.current}
                onChange={(e) => updateExperience(i, 'endDate', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-8 text-sm disabled:opacity-50"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={exp.current || false}
              onChange={(e) => {
                updateExperience(i, 'current', e.target.checked);
                if (e.target.checked) updateExperience(i, 'endDate', 'Present');
              }}
              className="rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/30 h-3.5 w-3.5"
            />
            <span className="text-xs text-slate-400">I currently work here</span>
          </label>

          {/* Bullets */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400">Bullet Points</span>
            {exp.bullets.map((bullet, bi) => (
              <div key={bi} className="flex gap-2 items-start">
                <span className="text-slate-500 text-xs mt-2.5 shrink-0">•</span>
                <Input
                  placeholder="Led development of..."
                  value={bullet}
                  onChange={(e) => updateBullet(i, bi, e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-8 text-sm flex-1"
                />
                <BulletRewriter
                  bullet={bullet}
                  expIndex={i}
                  bulletIndex={bi}
                  jobDescription={targetJD}
                />
                {exp.bullets.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBullet(i, bi)}
                    className="text-xs h-8 px-2 text-red-400 hover:text-red-300 shrink-0 cursor-pointer"
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addBullet(i)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              + Add bullet
            </Button>
          </div>
        </div>
      ))}

      <Button
        onClick={addExperience}
        variant="outline"
        className="w-full border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40 bg-transparent cursor-pointer"
      >
        + Add Experience
      </Button>
    </div>
  );
}
