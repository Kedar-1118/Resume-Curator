/**
 * Tiny inline SVG sparkline showing ATS score trend over time.
 * Width auto-adapts. Click to expand.
 */
export default function ATSSparkline({ scores = [], width = 120, height = 28 }) {
  if (!scores.length || scores.length < 2) return null;

  const values = scores.map((s) => s.score);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // Build SVG path
  const padding = 2;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = values.map((val, idx) => {
    const x = padding + (idx / (values.length - 1)) * innerW;
    const y = padding + innerH - ((val - min) / range) * innerH;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  // Gradient color based on trend (last vs first)
  const trend = values[values.length - 1] - values[0];
  const color = trend > 0 ? '#4ade80' : trend < 0 ? '#f87171' : '#94a3b8';
  const fillColor = trend > 0 ? '#4ade8020' : trend < 0 ? '#f8717120' : '#94a3b820';

  // Area fill path
  const firstX = padding;
  const lastX = padding + innerW;
  const areaD = `${pathD} L ${lastX},${height - padding} L ${firstX},${height - padding} Z`;

  return (
    <div className="inline-flex items-center gap-1.5" title={`Score trend: ${values.join(' → ')}`}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Gradient fill */}
        <path d={areaD} fill={fillColor} />
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* End dot */}
        {points.length > 0 && (
          <circle
            cx={parseFloat(points[points.length - 1].split(',')[0])}
            cy={parseFloat(points[points.length - 1].split(',')[1])}
            r="2"
            fill={color}
          />
        )}
      </svg>
      <span className={`text-[10px] font-medium ${trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-slate-500'}`}>
        {trend > 0 ? `+${trend}` : trend}
      </span>
    </div>
  );
}
