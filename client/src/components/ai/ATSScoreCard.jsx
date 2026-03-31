import { useMemo } from 'react';

const categoryLabels = {
  keywords: 'Keywords',
  actionVerbs: 'Action Verbs',
  quantification: 'Quantification',
  formatting: 'Formatting',
  sections: 'Sections',
  contactInfo: 'Contact Info',
  summaryRelevance: 'Summary Relevance',
  readability: 'Readability',
};

function ScoreRing({ score, size = 120 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">ATS Score</span>
      </div>
    </div>
  );
}

function CategoryRow({ name, data }) {
  const score = data?.score ?? 0;
  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-300">{name}</span>
        <span className="text-xs font-bold text-slate-400">{score}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${score}%`, transition: 'width 0.8s ease-out' }}
        />
      </div>
      {data?.feedback && (
        <p className="text-[11px] text-slate-500 leading-relaxed">{data.feedback}</p>
      )}
    </div>
  );
}

export default function ATSScoreCard({ result, loading, lastAnalyzed }) {
  const timeAgo = useMemo(() => {
    if (!lastAnalyzed) return null;
    const diff = Date.now() - new Date(lastAnalyzed).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }, [lastAnalyzed]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex justify-center">
          <div className="h-[120px] w-[120px] rounded-full bg-white/5" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-white/5 rounded w-1/3" />
            <div className="h-1.5 bg-white/5 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-10 text-slate-500 text-sm">
        Run an analysis to see your ATS score.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Score Ring */}
      <div className="flex flex-col items-center gap-2">
        <ScoreRing score={result.totalScore || 0} />
        {timeAgo && (
          <span className="text-[10px] text-slate-600">Last analyzed: {timeAgo}</span>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Breakdown</h4>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <CategoryRow key={key} name={label} data={result.breakdown?.[key]} />
        ))}
      </div>

      {/* Top Suggestions */}
      {result.topSuggestions?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Top Suggestions
          </h4>
          <ol className="space-y-1.5">
            {result.topSuggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-300">
                <span className="text-indigo-400 font-bold shrink-0">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
