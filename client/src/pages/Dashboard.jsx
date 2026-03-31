import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  getMe,
  getResumes,
  createResume,
  deleteResume,
  duplicateResume,
  updateResume,
} from '@/lib/api';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

// ─── Relative time helper ────────────────────────────────────
function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
}

// ─── Skeleton card for loading ───────────────────────────────
function SkeletonCard() {
  return (
    <Card className="bg-white/5 border-white/10 animate-pulse">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-white/10 rounded" />
            <div className="h-3 w-1/2 bg-white/5 rounded" />
          </div>
          <div className="h-5 w-16 bg-white/10 rounded-full ml-2" />
        </div>
        <div className="h-5 w-16 bg-white/5 rounded-full mb-4" />
        <div className="flex gap-2 pt-4 border-t border-white/10">
          <div className="flex-1 h-8 bg-white/10 rounded" />
          <div className="h-8 w-20 bg-white/5 rounded" />
          <div className="h-8 w-16 bg-white/5 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Create Resume Modal ─────────────────────────────────────
function CreateModal({ open, onClose, onSubmit, loading }) {
  const [title, setTitle] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTitle('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(title.trim() || 'Untitled Resume');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/50 animate-in zoom-in-95 fade-in duration-200">
        <h2 className="text-lg font-semibold text-white mb-1">Create New Resume</h2>
        <p className="text-xs text-slate-500 mb-5">
          Give your resume a name to get started. You can always rename it later.
        </p>
        <form onSubmit={handleSubmit}>
          <Input
            ref={inputRef}
            placeholder="e.g. Software Engineer v2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-10 text-sm mb-5"
            autoFocus
          />
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-slate-400 hover:text-white text-sm cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 text-sm cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  Creating...
                </span>
              ) : (
                'Create Resume'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ───────────────────────────────
function DeleteModal({ open, resumeTitle, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-black/50 animate-in zoom-in-95 fade-in duration-200">
        <div className="text-3xl mb-3">🗑️</div>
        <h3 className="text-base font-semibold text-white mb-1">Delete Resume?</h3>
        <p className="text-sm text-slate-400 mb-5">
          Are you sure you want to delete <strong className="text-white">"{resumeTitle}"</strong>?
          This action cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-slate-400 hover:text-white text-sm cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-500 text-white px-5 text-sm cursor-pointer"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Page ──────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(null);
  const [editingTitle, setEditingTitle] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
        const resumeData = await getResumes();
        setResumes(resumeData);
      } catch {
        navigate('/', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  // ── Create ─────────────────────────────────────────────────
  const handleCreate = async (title) => {
    setCreating(true);
    try {
      const newResume = await createResume({ title });
      toast.success('Resume created!');
      navigate(`/builder/${newResume._id}`);
    } catch {
      toast.error('Failed to create resume');
      setCreating(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteResume(deleteTarget._id);
      setResumes((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      toast.success('Resume deleted');
    } catch {
      toast.error('Failed to delete resume');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Duplicate ──────────────────────────────────────────────
  const handleDuplicate = async (id) => {
    setDuplicating(id);
    try {
      const dup = await duplicateResume(id);
      setResumes((prev) => [dup, ...prev]);
      toast.success('Resume duplicated!');
    } catch {
      toast.error('Failed to duplicate resume');
    } finally {
      setDuplicating(null);
    }
  };

  // ── Inline Title Edit ──────────────────────────────────────
  const startEditTitle = (resume) => {
    setEditingTitle(resume._id);
    setEditTitleValue(resume.title || '');
  };

  const saveTitle = async (id) => {
    const newTitle = editTitleValue.trim() || 'Untitled Resume';
    setEditingTitle(null);
    try {
      await updateResume(id, { title: newTitle });
      setResumes((prev) =>
        prev.map((r) => (r._id === id ? { ...r, title: newTitle } : r))
      );
    } catch {
      toast.error('Failed to rename');
    }
  };

  const handleTitleKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle(id);
    }
    if (e.key === 'Escape') {
      setEditingTitle(null);
    }
  };

  // ── ATS Score Badge ────────────────────────────────────────
  const getScoreBadge = (score) => {
    if (score == null) {
      return (
        <Badge className="shrink-0 text-[10px] bg-slate-700/40 text-slate-500 border-slate-600/30 font-medium">
          Not analyzed
        </Badge>
      );
    }
    const color =
      score >= 75
        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
        : score >= 50
        ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
        : 'bg-red-500/15 text-red-400 border-red-500/20';

    return (
      <Badge className={`shrink-0 text-[10px] font-bold ${color}`}>
        ATS: {score}
      </Badge>
    );
  };

  // ── Template Badge ─────────────────────────────────────────
  const templateLabel = {
    classic: 'Classic',
    modern: 'Modern',
    professional: 'Professional',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Your Resumes</h1>
            <p className="text-slate-400 mt-1 text-sm">
              {loading ? 'Loading...' : `${resumes.length} resume${resumes.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/updater')}
              variant="outline"
              className="border-white/15 text-slate-300 hover:text-white hover:border-white/30 bg-transparent text-sm cursor-pointer"
            >
              ✨ Improve Existing Resume
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              + Create New Resume
            </Button>
          </div>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <SkeletonCard key={n} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && resumes.length === 0 && (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/10 mb-6">
              <span className="text-5xl">📄</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">No resumes yet</h2>
            <p className="text-slate-400 max-w-sm mx-auto mb-8 text-sm">
              Create your first resume to get started, or paste an existing one to
              optimize it with AI.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                Create Your First Resume
              </Button>
              <Button
                onClick={() => navigate('/updater')}
                variant="outline"
                className="border-white/15 text-slate-300 hover:text-white hover:border-white/30 bg-transparent cursor-pointer"
              >
                Improve Existing Resume
              </Button>
            </div>
          </div>
        )}

        {/* Resume cards grid */}
        {!loading && resumes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {resumes.map((r) => (
              <Card
                key={r._id}
                className="bg-white/5 border-white/10 text-white hover:bg-white/[0.07] transition-all group hover:border-white/15 hover:shadow-lg hover:shadow-black/20"
              >
                <CardContent className="p-5">
                  {/* Title + ATS Score */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 mr-2">
                      {editingTitle === r._id ? (
                        <Input
                          value={editTitleValue}
                          onChange={(e) => setEditTitleValue(e.target.value)}
                          onBlur={() => saveTitle(r._id)}
                          onKeyDown={(e) => handleTitleKeyDown(e, r._id)}
                          className="bg-white/10 border-indigo-500/50 text-white h-7 text-sm px-2 py-0 -ml-2"
                          autoFocus
                        />
                      ) : (
                        <h3
                          className="font-semibold text-sm truncate cursor-pointer hover:text-indigo-300 transition-colors"
                          onDoubleClick={() => startEditTitle(r)}
                          title="Double-click to rename"
                        >
                          {r.title || 'Untitled Resume'}
                        </h3>
                      )}
                      <p className="text-[11px] text-slate-500 mt-1">
                        {timeAgo(r.updatedAt)}
                      </p>
                    </div>
                    {getScoreBadge(r.atsScore)}
                  </div>

                  {/* Template badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <Badge
                      variant="outline"
                      className="text-[10px] text-slate-400 border-white/10 font-normal capitalize"
                    >
                      {templateLabel[r.template] || 'Modern'}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/builder/${r._id}`)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 cursor-pointer shadow-sm"
                    >
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDuplicate(r._id)}
                      disabled={duplicating === r._id}
                      className="text-xs h-8 px-3 text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
                      title="Duplicate"
                    >
                      {duplicating === r._id ? (
                        <span className="animate-spin h-3 w-3 border border-slate-400 border-t-transparent rounded-full" />
                      ) : (
                        '📋 Duplicate'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(r)}
                      className="text-xs h-8 px-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                      title="Delete"
                    >
                      🗑️
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        loading={creating}
      />

      <DeleteModal
        open={!!deleteTarget}
        resumeTitle={deleteTarget?.title || 'Untitled Resume'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
