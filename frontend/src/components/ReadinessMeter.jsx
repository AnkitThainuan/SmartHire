// The signature visual: a segmented signal meter, like a confidence gauge.
// Reused as the wordmark tick (5 tiny bars) and, scaled up, as score displays.
const BAR_COUNT = 5;

const colorForFill = (filled, total) => {
  const ratio = filled / total;
  if (ratio >= 0.8) return "bg-momentum";
  if (ratio >= 0.5) return "bg-signal";
  if (ratio > 0) return "bg-alert";
  return "bg-mist";
};

const ReadinessMeter = ({ score = 0, max = 100, size = "md", label }) => {
  const filled = Math.round((score / max) * BAR_COUNT);
  const heights = size === "lg" ? ["h-4", "h-6", "h-8", "h-10", "h-12"] : ["h-2", "h-3", "h-4", "h-5", "h-6"];

  return (
    <div className="flex items-end gap-4">
      <div className="flex items-end gap-1" aria-hidden="true">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-sm transition-colors ${heights[i]} ${
              i < filled ? colorForFill(filled, BAR_COUNT) : "bg-mist"
            }`}
          />
        ))}
      </div>
      {label !== undefined && (
        <div>
          <div className="font-mono text-2xl font-bold leading-none">{score ?? "—"}</div>
          {label && <div className="text-xs text-ink/60 mt-1">{label}</div>}
        </div>
      )}
    </div>
  );
};

export default ReadinessMeter;
