import { useState } from 'react';
import useResumeStore from '@/store/resumeStore';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function Skills() {
  const skills = useResumeStore((s) => s.resume.skills);
  const updateField = useResumeStore((s) => s.updateField);
  const [inputValue, setInputValue] = useState('');

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      updateField('skills', null, [...skills, trimmed]);
    }
    setInputValue('');
  };

  const removeSkill = (index) => {
    updateField('skills', null, skills.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(inputValue);
    }
    // Remove last skill on backspace if input is empty
    if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
      removeSkill(skills.length - 1);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Skills</h3>
        <p className="text-xs text-slate-500">
          Type a skill and press Enter or comma to add. Include both technical and soft skills.
        </p>
      </div>

      {/* Empty state */}
      {skills.length === 0 && (
        <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-white/10 rounded-lg">
          No skills added yet. Type a skill and press Enter.
        </div>
      )}

      {/* Skill chips */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="bg-indigo-500/15 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/25 pr-1.5 text-xs gap-1"
            >
              {skill}
              <button
                onClick={() => removeSkill(i)}
                className="ml-1 hover:text-white rounded-full h-3.5 w-3.5 flex items-center justify-center text-[10px] cursor-pointer"
              >
                ✕
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Input
        id="skills-input"
        placeholder="e.g. React, TypeScript, Project Management..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500/50 h-9 text-sm"
      />

      <p className="text-xs text-slate-600">
        {skills.length} skill{skills.length !== 1 ? 's' : ''} added
      </p>
    </div>
  );
}
