import { useState } from 'react';
import { Button } from '@/components/ui/button';
import useResumeStore from '@/store/resumeStore';
import { addJDTarget, removeJDTarget, scoreMultiJD } from '@/lib/api';
import { toast } from 'sonner';

export default function JDTargetsPanel() {
  const resume = useResumeStore((s) => s.resume);
  const storeAddJDTarget = useResumeStore((s) => s.addJDTarget);
  const storeRemoveJDTarget = useResumeStore((s) => s.removeJDTarget);
  const [label, setLabel] = useState('');
  const [jdText, setJdText] = useState('');
  const [adding, setAdding] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [results, setResults] = useState(null);

  const targets = resume.jdTargets || [];

  const handleAdd = async () => {
    if (!label.trim() || !jdText.trim()) {
      toast.error('Both label and job description are required');
      return;
    }
    setAdding(true);
    try {
      await addJDTarget(resume._id, { label: label.trim(), jdText: jdText.trim() });
      storeAddJDTarget({ label: label.trim(), jdText: jdText.trim(), atsScore: null });
      setLabel('');
      setJdText('');
      setShowForm(false);
      toast.success('JD target added');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to add JD target');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (index) => {
    try {
      await removeJDTarget(resume._id, index);
      storeRemoveJDTarget(index);
      toast.success('JD target removed');
    } catch {
      toast.error('Failed to remove JD target');
    }
  };

  const handleScoreAll = async () => {
    if (!targets.length) return;
    setScoring(true);
    try {
      const res = await scoreMultiJD({ resumeId: resume._id });
      setResults(res);
      toast.success('All JD targets scored!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to score');
    } finally {
      setScoring(false);
    }
  };

  const getScoreColor = (score) => {
    if (score == null) return 'text-slate-500';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (score == null) return 'bg-slate-500/10';
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-amber-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          🎯 Multi-JD Targets
        </h3>
        <div className="flex items-center gap-2">
          {targets.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleScoreAll}
              disabled={scoring}
              className="text-xs text-slate-400 hover:text-white h-7 cursor-pointer"
            >
              {scoring ? (
                <span className="flex items-center gap-1.5">
                  <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                  Scoring...
                </span>
              ) : (
                '📊 Score All'
              )}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-7 cursor-pointer"
          >
            {showForm ? '✕ Cancel' : '+ Add JD'}
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. Google SWE, Meta PM)..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste the full job description..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={adding || !label.trim() || !jdText.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-7 cursor-pointer"
            >
              {adding ? 'Adding...' : 'Add Target'}
            </Button>
          </div>
        </div>
      )}

      {/* Targets list */}
      {targets.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-6">
          No JD targets yet. Add multiple job descriptions to compare your resume's fit.
        </p>
      ) : (
        <div className="space-y-2">
          {targets.map((target, idx) => {
            const displayScore = results?.[idx]?.atsScore ?? target.atsScore;
            return (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${getScoreBg(
                      displayScore
                    )} ${getScoreColor(displayScore)}`}
                  >
                    {displayScore ?? '—'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{target.label}</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-xs">
                      {target.jdText?.substring(0, 80)}...
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(idx)}
                  className="text-slate-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Remove"
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
