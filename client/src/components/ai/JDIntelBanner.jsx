import { useEffect, useState } from 'react';

/**
 * Displays parsed JD metadata (company, role, level, skills) as a compact banner
 * inside the Analyze tab when a JD has been parsed in the background.
 */
export default function JDIntelBanner({ parsedJD }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (parsedJD?.company || parsedJD?.roleTitle) {
      setVisible(true);
    }
  }, [parsedJD]);

  if (!visible || !parsedJD) return null;

  const { company, roleTitle, level, industry, mustHaveSkills, niceToHaveSkills } = parsedJD;

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
          🎯 JD Intelligence
        </h4>
        <button
          onClick={() => setVisible(false)}
          className="text-slate-600 hover:text-slate-400 text-xs cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {company && (
          <span className="text-slate-300">
            <span className="text-slate-500">Company:</span> {company}
          </span>
        )}
        {roleTitle && (
          <span className="text-slate-300">
            <span className="text-slate-500">Role:</span> {roleTitle}
          </span>
        )}
        {level && (
          <span className="text-slate-300">
            <span className="text-slate-500">Level:</span>{' '}
            <span className="capitalize">{level}</span>
          </span>
        )}
        {industry && (
          <span className="text-slate-300">
            <span className="text-slate-500">Industry:</span> {industry}
          </span>
        )}
      </div>

      {mustHaveSkills?.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Must-Have Skills</span>
          <div className="flex flex-wrap gap-1">
            {mustHaveSkills.map((skill, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full text-[11px] bg-red-500/10 text-red-400 border border-red-500/15"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {niceToHaveSkills?.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Nice-to-Have</span>
          <div className="flex flex-wrap gap-1">
            {niceToHaveSkills.map((skill, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/15"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
