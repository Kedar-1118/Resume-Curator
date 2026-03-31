import { useState } from 'react';
import useResumeStore from '@/store/resumeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Projects() {
  const projects = useResumeStore((s) => s.resume.projects);
  const addProject = useResumeStore((s) => s.addProject);
  const removeProject = useResumeStore((s) => s.removeProject);
  const updateProject = useResumeStore((s) => s.updateProject);
  const addProjectBullet = useResumeStore((s) => s.addProjectBullet);
  const removeProjectBullet = useResumeStore((s) => s.removeProjectBullet);
  const updateProjectBullet = useResumeStore((s) => s.updateProjectBullet);

  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleRemoveProject = (index) => {
    if (confirmDelete === index) {
      removeProject(index);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(index);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Projects</h3>
        <p className="text-xs text-slate-500">Add personal, academic, or professional projects.</p>
      </div>

      {projects.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-white/10 rounded-lg">
          No projects added yet. Add your first project.
        </div>
      )}

      {projects.map((proj, i) => (
        <div key={i} className="p-4 rounded-lg border border-white/10 bg-white/[0.02] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Project {i + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveProject(i)}
              className="text-xs h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
            >
              {confirmDelete === i ? 'Confirm remove?' : '✕ Remove'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Project Name</label>
              <Input
                placeholder="E-Commerce Platform"
                value={proj.name}
                onChange={(e) => updateProject(i, 'name', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Technologies</label>
              <Input
                placeholder="React, Node.js, MongoDB"
                value={proj.technologies}
                onChange={(e) => updateProject(i, 'technologies', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Description</label>
              <Input
                placeholder="Brief description of the project"
                value={proj.description}
                onChange={(e) => updateProject(i, 'description', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Link (optional)</label>
              <Input
                placeholder="https://github.com/..."
                value={proj.link}
                onChange={(e) => updateProject(i, 'link', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-8 text-sm"
              />
            </div>
          </div>

          {/* Bullets */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400">Bullet Points</span>
            {proj.bullets.map((bullet, bi) => (
              <div key={bi} className="flex gap-2 items-start">
                <span className="text-slate-500 text-xs mt-2.5 shrink-0">•</span>
                <Input
                  placeholder="Built a real-time..."
                  value={bullet}
                  onChange={(e) => updateProjectBullet(i, bi, e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-8 text-sm flex-1"
                />
                {proj.bullets.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProjectBullet(i, bi)}
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
              onClick={() => addProjectBullet(i)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              + Add bullet
            </Button>
          </div>
        </div>
      ))}

      <Button
        onClick={addProject}
        variant="outline"
        className="w-full border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40 bg-transparent cursor-pointer"
      >
        + Add Project
      </Button>
    </div>
  );
}
