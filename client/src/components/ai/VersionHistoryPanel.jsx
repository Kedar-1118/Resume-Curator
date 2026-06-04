import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import useResumeStore from '@/store/resumeStore';
import { getVersions, getVersionSnapshot } from '@/lib/api';
import { toast } from 'sonner';

export default function VersionHistoryPanel() {
  const resume = useResumeStore((s) => s.resume);
  const restoreVersion = useResumeStore((s) => s.restoreVersion);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    if (!resume._id) return;
    setLoading(true);
    getVersions(resume._id)
      .then(setVersions)
      .catch(() => toast.error('Failed to load versions'))
      .finally(() => setLoading(false));
  }, [resume._id]);

  const handlePreview = async (versionIndex) => {
    setComparing(true);
    try {
      const version = await getVersionSnapshot(resume._id, versionIndex);
      setSelectedVersion(version);
    } catch {
      toast.error('Failed to load version');
    } finally {
      setComparing(false);
    }
  };

  const handleRestore = () => {
    if (!selectedVersion?.snapshot) return;
    restoreVersion(selectedVersion.snapshot);
    setSelectedVersion(null);
    toast.success('Version restored — save to persist');
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          🕐 Version History
        </h3>
        <span className="text-[10px] text-slate-500">
          Last {versions.length} saves (max 10)
        </span>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-white/5 rounded-lg" />
          ))}
        </div>
      ) : versions.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-6">
          No previous versions yet. Versions are automatically saved when you edit.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {versions
            .slice()
            .reverse()
            .map((v, displayIdx) => {
              const actualIdx = versions.length - 1 - displayIdx;
              return (
                <button
                  key={actualIdx}
                  onClick={() => handlePreview(actualIdx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    selectedVersion && actualIdx === selectedVersion._versionIndex
                      ? 'bg-indigo-500/15 border border-indigo-500/30 text-white'
                      : 'bg-white/[0.02] border border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-slate-600 font-mono">v{actualIdx + 1}</span>
                    <span>{new Date(v.savedAt).toLocaleDateString()}</span>
                    <span className="text-slate-600">
                      {new Date(v.savedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </span>
                  <span className="text-slate-600">{timeAgo(v.savedAt)}</span>
                </button>
              );
            })}
        </div>
      )}

      {/* Diff preview + restore */}
      {selectedVersion && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-400">
              Version from {new Date(selectedVersion.savedAt).toLocaleString()}
            </h4>
            <Button
              size="sm"
              onClick={handleRestore}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs h-7 cursor-pointer"
            >
              ↩️ Restore This Version
            </Button>
          </div>

          {/* Simple diff summary */}
          {selectedVersion.snapshot && (
            <div className="space-y-2 text-xs text-slate-400">
              <DiffLine
                label="Name"
                old={selectedVersion.snapshot.personal?.name}
                current={resume.personal?.name}
              />
              <DiffLine
                label="Summary"
                old={selectedVersion.snapshot.summary?.substring(0, 80)}
                current={resume.summary?.substring(0, 80)}
                truncated
              />
              <DiffLine
                label="Experience entries"
                old={selectedVersion.snapshot.experience?.length}
                current={resume.experience?.length}
              />
              <DiffLine
                label="Skills count"
                old={selectedVersion.snapshot.skills?.length}
                current={resume.skills?.length}
              />
              <DiffLine
                label="ATS Score"
                old={selectedVersion.snapshot.atsScore}
                current={resume.atsScore}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DiffLine({ label, old, current, truncated }) {
  const oldStr = old != null ? String(old) : '—';
  const curStr = current != null ? String(current) : '—';
  const changed = oldStr !== curStr;

  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-500 shrink-0 w-28">{label}:</span>
      {changed ? (
        <span>
          <span className="text-red-400/70 line-through mr-2">{oldStr}{truncated ? '…' : ''}</span>
          <span className="text-green-400">{curStr}{truncated ? '…' : ''}</span>
        </span>
      ) : (
        <span className="text-slate-600">{curStr}{truncated ? '…' : ''} (unchanged)</span>
      )}
    </div>
  );
}
