import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateSummary } from '@/lib/api';
import useResumeStore from '@/store/resumeStore';
import { toast } from 'sonner';

export default function SummaryGenerator() {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(null);
  const resumeId = useResumeStore((s) => s.resume._id);
  const targetJD = useResumeStore((s) => s.resume.targetJD);
  const updateField = useResumeStore((s) => s.updateField);

  const handleGenerate = async () => {
    if (!resumeId) {
      toast.error('Save your resume first');
      return;
    }
    setLoading(true);
    setGenerated(null);
    try {
      const data = await generateSummary({ resumeId });
      setGenerated(data.summary);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (generated) {
      updateField('summary', null, generated);
      toast.success('Summary updated');
      setGenerated(null);
    }
  };

  if (!targetJD) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="text-xs text-indigo-400 disabled:opacity-40 cursor-not-allowed"
        title="Add a job description first in the Analyze tab"
      >
        ✨ Generate with AI
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleGenerate}
        disabled={loading}
        className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
      >
        {loading ? (
          <>
            <span className="animate-spin h-3 w-3 border border-indigo-400 border-t-transparent rounded-full mr-1" />
            Generating...
          </>
        ) : (
          '✨ Generate with AI'
        )}
      </Button>

      {/* Generated summary preview */}
      {generated && (
        <div className="space-y-2 p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5">
          <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-medium">
            AI Generated Summary
          </span>
          <p className="text-sm text-slate-200 leading-relaxed">{generated}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAccept}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs cursor-pointer"
            >
              ✓ Use this summary
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleGenerate}
              disabled={loading}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              ↻ Regenerate
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setGenerated(null)}
              className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
