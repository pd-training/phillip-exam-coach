"use client";

// Per-chapter performance for one exam simulation, in the style of a
// "performance by topic area" chart: the band is the likely range for the
// student's score, the solid line is their score, and the dotted line is the
// average across all students' simulations on the paper.

export interface ChapterPerformance {
  chapterNumber: number;
  title: string | null;
  correct: number;
  total: number;
  pct: number;
  averagePct: number | null;
}

interface Props {
  paperName: string;
  passingScore: number;
  studentsCompared: number;
  chapters: ChapterPerformance[];
}

const W = 760;
const H = 300;
const LEFT = 48;
const RIGHT = 16;
const TOP = 16;
const BOTTOM = 252;

// 95% range for a proportion, in percent
function likelyRange(pct: number, n: number): [number, number] {
  if (n === 0) return [pct, pct];
  const p = pct / 100;
  const se = Math.sqrt((p * (1 - p)) / n);
  return [Math.max(0, p - 1.96 * se) * 100, Math.min(1, p + 1.96 * se) * 100];
}

export default function ChapterPerformanceChart({ paperName, passingScore, studentsCompared, chapters }: Props) {
  const n = chapters.length;
  const plotW = W - LEFT - RIGHT;
  const colW = plotW / Math.max(n, 1);
  const y = (v: number) => BOTTOM - (Math.min(100, Math.max(0, v)) / 100) * (BOTTOM - TOP);
  const seg = colW * 0.6;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Your performance by chapter</h3>
        <p className="text-sm text-gray-600 mt-1">
          Percentage of questions you answered correctly in each chapter of {paperName}.
          {studentsCompared > 0
            ? ` The dotted line is the average of ${studentsCompared} other simulation${studentsCompared === 1 ? "" : "s"}.`
            : " No other simulations on this paper yet, so there is no average to compare."}
        </p>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-700">
        <span className="inline-flex items-center gap-2">
          <svg width="28" height="8" aria-hidden="true"><line x1="0" y1="4" x2="28" y2="4" stroke="#1f2937" strokeWidth="3" /></svg>
          Your score
        </span>
        <span className="inline-flex items-center gap-2">
          <svg width="18" height="14" aria-hidden="true"><rect width="18" height="14" fill="#cfe6f5" /></svg>
          Likely range
        </span>
        <span className="inline-flex items-center gap-2">
          <svg width="28" height="8" aria-hidden="true"><line x1="0" y1="4" x2="28" y2="4" stroke="#1f2937" strokeWidth="2" strokeDasharray="2 3" /></svg>
          All students' average
        </span>
        <span className="inline-flex items-center gap-2">
          <svg width="28" height="8" aria-hidden="true"><line x1="0" y1="4" x2="28" y2="4" stroke="#b91c1c" strokeWidth="1.5" /></svg>
          Pass mark ({passingScore}%)
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img" aria-label={`Your percentage correct by chapter for ${paperName}`}>
          {/* gridlines and axis labels */}
          {[0, 25, 50, 75, 100].map((g) => (
            <g key={g}>
              <line x1={LEFT} x2={W - RIGHT} y1={y(g)} y2={y(g)} stroke="#e5e7eb" strokeWidth="1" />
              <text x={LEFT - 8} y={y(g) + 4} fontSize="11" textAnchor="end" fill="#6b7280">{g}%</text>
            </g>
          ))}

          {/* pass mark */}
          <line x1={LEFT} x2={W - RIGHT} y1={y(passingScore)} y2={y(passingScore)} stroke="#b91c1c" strokeWidth="1.5" />

          {chapters.map((c, i) => {
            const cx = LEFT + (i + 0.5) * colW;
            const [lo, hi] = likelyRange(c.pct, c.total);
            return (
              <g key={c.chapterNumber}>
                {/* likely range band */}
                <rect x={cx - seg / 2} y={y(hi)} width={seg} height={Math.max(2, y(lo) - y(hi))} fill="#cfe6f5" rx="2">
                  <title>{`Chapter ${c.chapterNumber}: likely ${Math.round(lo)}% to ${Math.round(hi)}%`}</title>
                </rect>
                {/* average (dotted) */}
                {c.averagePct !== null && (
                  <line x1={cx - seg / 2} x2={cx + seg / 2} y1={y(c.averagePct)} y2={y(c.averagePct)} stroke="#1f2937" strokeWidth="2" strokeDasharray="2 3">
                    <title>{`Average: ${c.averagePct}%`}</title>
                  </line>
                )}
                {/* your score (solid) */}
                <line x1={cx - seg / 2} x2={cx + seg / 2} y1={y(c.pct)} y2={y(c.pct)} stroke="#1f2937" strokeWidth="3" strokeLinecap="round">
                  <title>{`Chapter ${c.chapterNumber}: ${c.pct}% (${c.correct} of ${c.total})`}</title>
                </line>
                <text x={cx} y={BOTTOM + 18} fontSize="12" textAnchor="middle" fill="#111827" fontWeight="600">Ch {c.chapterNumber}</text>
                <text x={cx} y={BOTTOM + 34} fontSize="11" textAnchor="middle" fill="#6b7280">{c.correct}/{c.total}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Same data as a table, for screen readers and printing */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b border-gray-200">
              <th className="py-2 pr-4 font-semibold">Chapter</th>
              <th className="py-2 pr-4 font-semibold">Correct</th>
              <th className="py-2 pr-4 font-semibold">Your score</th>
              <th className="py-2 font-semibold">All students' average</th>
            </tr>
          </thead>
          <tbody>
            {chapters.map((c) => (
              <tr key={c.chapterNumber} className="border-b border-gray-100">
                <td className="py-2 pr-4 text-gray-900">Chapter {c.chapterNumber}{c.title ? `: ${c.title}` : ""}</td>
                <td className="py-2 pr-4 text-gray-700">{c.correct} of {c.total}</td>
                <td className="py-2 pr-4 font-semibold text-gray-900">{c.pct}%</td>
                <td className="py-2 text-gray-700">{c.averagePct !== null ? `${c.averagePct}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
