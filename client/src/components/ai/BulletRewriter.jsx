import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { rewriteBullet } from '@/lib/api';
import useResumeStore from '@/store/resumeStore';
import { toast } from 'sonner';

export default function BulletRewriter({ bullet, expIndex, bulletIndex, jobDescription }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState(false);
  const updateBullet = useResumeStore((s) => s.updateBullet);

  const handleRewrite = async () => {
    if (!bullet.trim()) {
      toast.error('Write a bullet point first');
      return;
    }
    setLoading(true);
    setOpen(true);
    setResult(null);
    try {
      const data = await rewriteBullet({
        bullet,
        jobDescription: jobDescription || '',
        role: '',
      });
      setResult(data);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to rewrite bullet');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (result?.rewritten) {
      updateBullet(expIndex, bulletIndex, result.rewritten);
      toast.success('Bullet updated');
    }
    setOpen(false);
    setResult(null);
  };

  const handleReject = () => {
    setOpen(false);
    setResult(null);
  };

  const handleRetry = () => {
    handleRewrite();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRewrite}
        disabled={loading || !bullet.trim()}
        className="text-xs h-8 px-2 text-indigo-400 hover:text-indigo-300 shrink-0 disabled:opacity-40 cursor-pointer"
        title={jobDescription ? 'Rewrite with AI' : 'Add a job description first'}
      >
        {loading ? (
          <span className="animate-spin h-3 w-3 border border-indigo-400 border-t-transparent rounded-full" />
        ) : (
          '✨'
        )}
      </Button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">AI Bullet Rewriter</h3>

            {loading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
                <p className="text-xs text-slate-400">Rewriting your bullet point...</p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                {/* Original */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Original</span>
                  <p className="text-sm text-slate-400 line-through">{result.original}</p>
                </div>

                {/* Rewritten */}
                <div className="space-y-1">
                  <span className="text-[10px] text-green-400 uppercase tracking-wider">Rewritten</span>
                  <p className="text-sm text-white bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                    {result.rewritten}
                  </p>
                </div>

                {/* Improvements */}
                {result.improvements?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Improvements</span>
                    <ul className="space-y-1">
                      {result.improvements.map((imp, i) => (
                        <li key={i} className="flex gap-2 text-xs text-slate-300">
                          <span className="text-indigo-400 shrink-0">✓</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    className="bg-green-600 hover:bg-green-500 text-white text-xs flex-1 cursor-pointer"
                  >
                    ✓ Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRetry}
                    className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    ↻ Try Again
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleReject}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    ✕ Reject
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
