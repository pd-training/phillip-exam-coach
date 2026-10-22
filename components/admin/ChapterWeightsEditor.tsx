"use client";

import { allocateByWeight } from "@/lib/chapter-weights";

interface Props {
  start: number;
  end: number;
  questionCount: number;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  weights: Record<string, number>;
  onWeightsChange: (weights: Record<string, number>) => void;
  // Questions in the bank per chapter, e.g. { "1": 38, "2": 29 }
  bank: Record<string, number>;
}

// Lets the admin choose how often each chapter comes up in an exam simulation part.
export default function ChapterWeightsEditor({
  start,
  end,
  questionCount,
  enabled,
  onEnabledChange,
  weights,
  onWeightsChange,
  bank,
}: Props) {
  const validRange = Number.isFinite(start) && Number.isFinite(end) && start >= 1 && end >= start && end - start < 50;
  const chapters = validRange ? Array.from({ length: end - start + 1 }, (_, i) => String(start + i)) : [];

  const weightFor = (ch: string) => (weights[ch] ?? 1);

  const handleToggle = (on: boolean) => {
    onEnabledChange(on);
    if (on) {
      onWeightsChange(Object.fromEntries(chapters.map((ch) => [ch, weights[ch] ?? 1])));
    }
  };

  const setWeight = (ch: string, value: string) => {
    const n = Math.min(10, Math.max(0, Math.floor(Number(value) || 0)));
    onWeightsChange({ ...weights, [ch]: n });
  };

  const inRange: Record<string, number> = Object.fromEntries(chapters.map((ch) => [ch, weightFor(ch)]));
  const counts = enabled ? allocateByWeight(questionCount || 0, inRange) : {};
  const maxCount = Math.max(1, ...Object.values(counts));
  const weightSum = Object.values(inRange).reduce((a, b) => a + b, 0);
  const short = chapters.filter((ch) => (counts[ch] || 0) > (bank[ch] ?? 0));

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => handleToggle(e.target.checked)}
          disabled={!validRange}
          className="mt-1"
        />
        <span>
          <span className="block text-sm font-medium text-gray-900">Weight chapters</span>
          <span className="block text-xs text-gray-600">
            Choose how often each chapter comes up. Off means questions are drawn at random from the whole range.
          </span>
        </span>
      </label>

      {!validRange && (
        <p className="mt-3 text-xs text-gray-600">Enter a valid chapter range to set weights.</p>
      )}

      {enabled && validRange && (
        <div className="mt-4 space-y-2">
          {chapters.map((ch) => {
            const count = counts[ch] || 0;
            const available = bank[ch] ?? 0;
            const over = count > available;
            return (
              <div
                key={ch}
                className={`grid grid-cols-[5.5rem_1fr_auto_4.5rem] items-center gap-3 rounded-md px-3 py-2 ${
                  over ? "bg-amber-50 border border-amber-300" : "border border-gray-200"
                }`}
              >
                <span className="text-sm font-medium text-gray-900">Chapter {ch}</span>
                <div className="h-2.5 bg-blue-50 rounded-full overflow-hidden min-w-0">
                  <div className="h-full bg-blue-700 rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
                </div>
                <span className="text-sm text-gray-700 tabular-nums whitespace-nowrap">
                  {count} of {available}
                  {over && <span className="ml-1 text-amber-800 font-semibold">short</span>}
                </span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={weightFor(ch)}
                  onChange={(e) => setWeight(ch, e.target.value)}
                  aria-label={`Weight for chapter ${ch}`}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm tabular-nums"
                />
              </div>
            );
          })}

          <p className="pt-1 text-xs">
            {weightSum === 0 ? (
              <span className="text-amber-800 font-semibold">Set at least one weight above 0.</span>
            ) : short.length > 0 ? (
              <span className="text-amber-800 font-semibold">
                Chapter {short.join(", ")} needs more questions than the bank has. Lower its weight or add questions.
              </span>
            ) : (
              <span className="text-gray-600">Counts add up to {questionCount} questions for this part.</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
