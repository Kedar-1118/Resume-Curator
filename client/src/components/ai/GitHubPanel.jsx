import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import useResumeStore from '@/store/resumeStore';
import {
  disconnectGithub,
  ingestGithubRepos,
  getGithubIngestStatus,
  generateGithubProjects,
} from '@/lib/api';
import { toast } from 'sonner';

const GITHUB_AUTH_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/github`;

export default function GitHubPanel() {
  const resume = useResumeStore((s) => s.resume);
  const generatedProjects = useResumeStore((s) => s.generatedProjects);
  const setGeneratedProjects = useResumeStore((s) => s.setGeneratedProjects);
  const applyGeneratedProjects = useResumeStore((s) => s.applyGeneratedProjects);

  const [status, setStatus] = useState({
    connected: false,
    username: null,
    ingestionStatus: 'idle',
  });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState(new Set());

  // Poll ingestion status
  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status.ingestionStatus === 'running') {
      const interval = setInterval(async () => {
        const s = await getGithubIngestStatus();
        setStatus(s);
        if (s.ingestionStatus !== 'running') {
          clearInterval(interval);
          setIngesting(false);
          if (s.ingestionStatus === 'done') {
            toast.success('GitHub repos synced successfully!');
          }
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [status.ingestionStatus]);

  const fetchStatus = async () => {
    try {
      const s = await getGithubIngestStatus();
      setStatus(s);
    } catch {
      // Not connected
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleIngest = async () => {
    setIngesting(true);
    try {
      await ingestGithubRepos();
      setStatus((s) => ({ ...s, ingestionStatus: 'running' }));
      toast.info('Syncing repos in background...');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to sync repos');
      setIngesting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGithub();
      setStatus({ connected: false, username: null, ingestionStatus: 'idle' });
      toast.success('GitHub disconnected');
    } catch {
      toast.error('Failed to disconnect GitHub');
    }
  };

  const handleGenerateProjects = async () => {
    if (!resume.targetJD) {
      toast.error('Paste a job description first');
      return;
    }
    setGenerating(true);
    try {
      const projects = await generateGithubProjects({
        resumeId: resume._id,
        count: 3,
      });
      setGeneratedProjects(Array.isArray(projects) ? projects : []);
      setSelectedProjects(new Set(projects.map((_, i) => i)));
      toast.success('Projects generated from your repos!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to generate projects');
    } finally {
      setGenerating(false);
    }
  };

  const toggleProject = (idx) => {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleApply = () => {
    const selected = generatedProjects.filter((_, i) => selectedProjects.has(i));
    if (!selected.length) {
      toast.error('Select at least one project');
      return;
    }
    applyGeneratedProjects(selected);
    toast.success(`${selected.length} project(s) added to your resume`);
  };

  if (loadingStatus) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-4 bg-white/5 rounded w-1/3" />
        <div className="h-10 bg-white/5 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          🐙 GitHub Projects
        </h3>
        {status.connected && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
            @{status.username}
          </span>
        )}
      </div>

      {/* Not connected */}
      {!status.connected && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 text-center space-y-3">
          <p className="text-sm text-slate-400">
            Connect your GitHub to auto-generate project entries tailored to your target JD.
          </p>
          <a
            href={GITHUB_AUTH_URL}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Connect GitHub
          </a>
        </div>
      )}

      {/* Connected — actions */}
      {status.connected && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleIngest}
              disabled={ingesting || status.ingestionStatus === 'running'}
              className="text-xs text-slate-400 hover:text-white h-7 cursor-pointer"
            >
              {ingesting || status.ingestionStatus === 'running' ? (
                <span className="flex items-center gap-1.5">
                  <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                  Syncing...
                </span>
              ) : (
                '🔄 Sync Repos'
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleGenerateProjects}
              disabled={generating || status.ingestionStatus !== 'done'}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-7 cursor-pointer"
            >
              {generating ? (
                <span className="flex items-center gap-1.5">
                  <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                  Generating...
                </span>
              ) : (
                '✨ Generate Projects'
              )}
            </Button>
            <div className="ml-auto">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDisconnect}
                className="text-xs text-red-400/60 hover:text-red-400 h-7 cursor-pointer"
              >
                Disconnect
              </Button>
            </div>
          </div>

          {status.ingestionStatus === 'idle' && (
            <p className="text-xs text-slate-500">
              Click "Sync Repos" to fetch and index your GitHub repositories.
            </p>
          )}
          {status.ingestionStatus === 'done' && !resume.targetJD && (
            <p className="text-xs text-slate-500">
              Paste a job description in the Analyze tab to generate tailored projects.
            </p>
          )}
        </div>
      )}

      {/* Generated projects */}
      {generatedProjects.length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Generated Projects
            </h4>
            <Button
              size="sm"
              onClick={handleApply}
              className="bg-green-600 hover:bg-green-500 text-white text-xs h-7 cursor-pointer"
            >
              ➕ Add Selected ({selectedProjects.size})
            </Button>
          </div>

          {generatedProjects.map((proj, idx) => (
            <div
              key={idx}
              onClick={() => toggleProject(idx)}
              className={`rounded-lg border p-3 space-y-2 cursor-pointer transition-colors ${
                selectedProjects.has(idx)
                  ? 'border-indigo-500/30 bg-indigo-500/5'
                  : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-start justify-between">
                <h5 className="text-sm font-medium text-white">{proj.name}</h5>
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                    selectedProjects.has(idx)
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-white/20'
                  }`}
                >
                  {selectedProjects.has(idx) && '✓'}
                </div>
              </div>
              <p className="text-xs text-slate-400">{proj.description}</p>
              {proj.techStack?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {proj.techStack.map((t, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-slate-500"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {proj.highlights?.length > 0 && (
                <ul className="space-y-1">
                  {proj.highlights.map((h, i) => (
                    <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                      <span className="text-slate-600 shrink-0">•</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
