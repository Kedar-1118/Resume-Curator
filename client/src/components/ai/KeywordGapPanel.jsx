import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function KeywordGapPanel({ result, loading }) {
  const copyKeyword = (keyword) => {
    navigator.clipboard.writeText(keyword).then(() => {
      toast.success(`Copied "${keyword}" — add this to your resume`);
    });
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-white/5 rounded w-1/3" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-6 bg-white/5 rounded-full w-16" />
          ))}
        </div>
        <div className="h-4 bg-white/5 rounded w-1/3" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 bg-white/5 rounded-full w-20" />
          ))}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-10 text-slate-500 text-sm">
        Run an analysis to see keyword gaps.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Matched Keywords */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Matched Keywords
          </h4>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400">
            {result.matched?.length || 0}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {result.matched?.length > 0 ? (
            result.matched.map((kw, i) => (
              <Badge
                key={i}
                className="bg-green-500/15 text-green-400 border-green-500/20 text-[11px] font-normal"
              >
                ✓ {kw}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-slate-600">No matched keywords found</span>
          )}
        </div>
      </div>

      {/* Missing Keywords */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Missing Keywords
          </h4>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">
            {result.missing?.length || 0}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {result.missing?.length > 0 ? (
            result.missing.map((kw, i) => (
              <Badge
                key={i}
                onClick={() => copyKeyword(kw)}
                className="bg-red-500/15 text-red-400 border-red-500/20 text-[11px] font-normal cursor-pointer hover:bg-red-500/25 transition-colors"
                title="Click to copy"
              >
                ✗ {kw}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-slate-600">No missing keywords — great!</span>
          )}
        </div>
        {result.missing?.length > 0 && (
          <p className="text-[10px] text-slate-600">Click a keyword to copy it to clipboard</p>
        )}
      </div>

      {/* Suggestions */}
      {result.suggested?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Suggestions
          </h4>
          <ul className="space-y-1.5">
            {result.suggested.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-300">
                <span className="text-indigo-400 shrink-0">→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
