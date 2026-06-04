import { useState } from 'react';
import { Button } from '@/components/ui/button';
import useResumeStore from '@/store/resumeStore';
import { generateCoverLetter, exportCoverLetterDOCX } from '@/lib/api';
import { toast } from 'sonner';

export default function CoverLetterPanel() {
  const resume = useResumeStore((s) => s.resume);
  const setCoverLetter = useResumeStore((s) => s.setCoverLetter);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const coverLetter = resume.coverLetter;
  const hasJD = !!resume.targetJD;

  const handleGenerate = async () => {
    if (!hasJD) {
      toast.error('Paste a job description first');
      return;
    }
    setLoading(true);
    try {
      const result = await generateCoverLetter({ resumeId: resume._id });
      setCoverLetter({ ...result, generatedAt: new Date().toISOString() });
      toast.success('Cover letter generated!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to generate cover letter');
    } finally {
      setLoading(false);
    }
  };

  const handleExportDOCX = async () => {
    setExporting(true);
    try {
      const res = await exportCoverLetterDOCX(resume._id);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(resume.title || 'cover-letter').replace(/[^a-zA-Z0-9\s-]/g, '').trim()} - Cover Letter.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Cover letter downloaded');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to export cover letter');
    } finally {
      setExporting(false);
    }
  };

  const copyToClipboard = () => {
    if (!coverLetter) return;
    const text = [
      coverLetter.salutation,
      '',
      coverLetter.opening,
      '',
      ...(coverLetter.bodyParagraphs || []).flatMap((p) => [p, '']),
      coverLetter.closing,
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      toast.success('Cover letter copied to clipboard');
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          ✉️ Cover Letter
        </h3>
        <div className="flex items-center gap-2">
          {coverLetter?.opening && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="text-xs text-slate-400 hover:text-white h-7 cursor-pointer"
              >
                📋 Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportDOCX}
                disabled={exporting}
                className="text-xs text-slate-400 hover:text-white h-7 cursor-pointer"
              >
                {exporting ? '⏳' : '📄'} DOCX
              </Button>
            </>
          )}
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={loading || !hasJD}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-7 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                Generating...
              </span>
            ) : coverLetter?.opening ? (
              '🔄 Regenerate'
            ) : (
              '✨ Generate'
            )}
          </Button>
        </div>
      </div>

      {!hasJD && (
        <p className="text-xs text-slate-500">
          Paste a job description in the Analyze tab first to generate a tailored cover letter.
        </p>
      )}

      {coverLetter?.opening && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3 text-sm text-slate-300 leading-relaxed">
          {coverLetter.subject && (
            <p className="text-xs text-slate-500 font-medium mb-2">
              Subject: {coverLetter.subject}
            </p>
          )}
          <p className="font-medium text-white">{coverLetter.salutation}</p>
          <p>{coverLetter.opening}</p>
          {coverLetter.bodyParagraphs?.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <p>{coverLetter.closing}</p>
          {coverLetter.generatedAt && (
            <p className="text-[10px] text-slate-600 pt-2">
              Generated {new Date(coverLetter.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
