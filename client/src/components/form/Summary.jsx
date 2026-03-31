import useResumeStore from '@/store/resumeStore';
import { Textarea } from '@/components/ui/textarea';
import SummaryGenerator from '@/components/ai/SummaryGenerator';

export default function Summary() {
  const summary = useResumeStore((s) => s.resume.summary);
  const updateField = useResumeStore((s) => s.updateField);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Professional Summary</h3>
        <p className="text-xs text-slate-500">
          3–4 lines, keyword-rich, tailored to your target role.
        </p>
      </div>

      <div className="space-y-2">
        <Textarea
          id="summary-textarea"
          placeholder="Results-driven Software Engineer with 5+ years of experience building scalable applications..."
          value={summary || ''}
          onChange={(e) => updateField('summary', null, e.target.value)}
          rows={5}
          className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500/50 text-sm resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {(summary || '').length} characters
          </span>
          <SummaryGenerator />
        </div>
      </div>
    </div>
  );
}
