"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StudentNav from "@/components/StudentNav";
import Link from "next/link";

interface Attempt {
  id: string;
  paperid: string;
  paperTitle: string;
  score: number;
  result: string;
  timeTaken: number;
  submittedat: string;
}

export default function AllAttemptsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPaperId, setOpenPaperId] = useState<string | null>(null);
  const [recs, setRecs] = useState<any>(null);
  const [paperSort, setPaperSort] = useState<{ key: 'paper' | 'attempts' | 'passRate' | 'avgScore' | 'best'; dir: 'asc' | 'desc' }>({ key: 'attempts', dir: 'desc' });

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/student/recommendations")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRecs(data))
      .catch(() => setRecs(null));
  }, [status]);

  useEffect(() => {
    if (!openPaperId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPaperId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPaperId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAttempts();
    }
  }, [status]);

  const fetchAttempts = async () => {
    try {
      const res = await fetch("/api/student/attempts");
      if (res.ok) {
        const data = await res.json();
        setAttempts(data.attempts || []);
      }
    } catch (error) {
      console.error("Failed to fetch attempts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-gray-600">Loading attempts...</p>
        </div>
      </div>
    );
  }

  // Per-paper breakdown for the stats table
  const paperRows = (() => {
    const map = new Map<string, { paperId: string; paperTitle: string; attempts: number; passes: number; scoreSum: number; best: number }>();
    for (const a of attempts) {
      const row = map.get(a.paperid) ?? { paperId: a.paperid, paperTitle: a.paperTitle, attempts: 0, passes: 0, scoreSum: 0, best: 0 };
      row.attempts += 1;
      if (a.result === "Pass") row.passes += 1;
      row.scoreSum += a.score;
      row.best = Math.max(row.best, a.score);
      map.set(a.paperid, row);
    }
    return Array.from(map.values()).map((r) => ({
      ...r,
      passRate: Math.round((r.passes / r.attempts) * 100),
      avgScore: Math.round(r.scoreSum / r.attempts),
    }));
  })();

  const openPaperAttempts = openPaperId
    ? attempts.filter((a) => a.paperid === openPaperId)
    : [];
  const openPaperTitle = openPaperAttempts[0]?.paperTitle ?? "";
  const openPaperPassRate = openPaperAttempts.length
    ? Math.round((openPaperAttempts.filter((a) => a.result === "Pass").length / openPaperAttempts.length) * 100)
    : 0;
  const openPaperBest = openPaperAttempts.length
    ? Math.max(...openPaperAttempts.map((a) => a.score))
    : 0;

  const sortedPaperRows = [...paperRows].sort((a, b) => {
    const dir = paperSort.dir === "asc" ? 1 : -1;
    if (paperSort.key === "paper") return a.paperTitle.localeCompare(b.paperTitle) * dir;
    const key = paperSort.key === "passRate" ? "passRate" : paperSort.key === "avgScore" ? "avgScore" : paperSort.key === "best" ? "best" : "attempts";
    return (a[key] - b[key]) * dir;
  });

  const togglePaperSort = (key: typeof paperSort.key) => {
    setPaperSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "paper" ? "asc" : "desc" }
    );
  };

  const sortIndicator = (key: typeof paperSort.key) =>
    paperSort.key === key ? (paperSort.dir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <StudentNav />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12 px-0 border-b border-blue-900">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">My Progress</h1>
          <p className="text-gray-200">View all your exam attempts and performance</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full">
        {/* Overall stats and per-paper breakdown */}
        {attempts.length > 0 && (
          <div className="mb-8 bg-white rounded-lg p-6 border border-gray-200">
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Attempts</p>
                <p className="text-3xl font-bold text-gray-900">{attempts.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Pass Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {Math.round((attempts.filter((a) => a.result === "Pass").length / attempts.length) * 100)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Avg Score</p>
                <p className="text-3xl font-bold text-blue-600">
                  {Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)}%
                </p>
              </div>
            </div>

            <h2 className="text-sm font-semibold text-gray-900 mb-3">By paper</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-600">
                    <th className="py-2 pr-4 font-semibold">
                      <button onClick={() => togglePaperSort("paper")} className="hover:text-gray-900">Paper{sortIndicator("paper")}</button>
                    </th>
                    <th className="py-2 pr-4 font-semibold text-right">
                      <button onClick={() => togglePaperSort("attempts")} className="hover:text-gray-900">Attempts{sortIndicator("attempts")}</button>
                    </th>
                    <th className="py-2 pr-4 font-semibold text-right">
                      <button onClick={() => togglePaperSort("passRate")} className="hover:text-gray-900">Pass rate{sortIndicator("passRate")}</button>
                    </th>
                    <th className="py-2 pr-4 font-semibold text-right">
                      <button onClick={() => togglePaperSort("avgScore")} className="hover:text-gray-900">Avg score{sortIndicator("avgScore")}</button>
                    </th>
                    <th className="py-2 font-semibold text-right">
                      <button onClick={() => togglePaperSort("best")} className="hover:text-gray-900">Best{sortIndicator("best")}</button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPaperRows.map((row) => (
                    <tr
                      key={row.paperId}
                      onClick={() => setOpenPaperId(row.paperId)}
                      className="border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition"
                    >
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {row.paperTitle} <span className="text-blue-600 ml-1">›</span>
                      </td>
                      <td className="py-3 pr-4 text-right text-gray-900">{row.attempts}</td>
                      <td className={`py-3 pr-4 text-right font-semibold ${row.passRate >= 50 ? "text-green-600" : "text-red-600"}`}>{row.passRate}%</td>
                      <td className="py-3 pr-4 text-right text-gray-900">{row.avgScore}%</td>
                      <td className="py-3 text-right text-gray-900">{row.best}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-3">Click a paper to see its attempts.</p>
          </div>
        )}

        {/* Next Steps (rules-based recommendations) */}
        {recs && (recs.priority.length > 0 || recs.review.length > 0 || recs.notPractised.length > 0) && (
          <div className="mb-8 bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Your next steps</h2>
            <p className="text-sm text-gray-600 mb-6">Based on your answers across all papers</p>

            {recs.priority.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-3">Practise now</p>
                <div className="space-y-3">
                  {recs.priority.map((c: any) => (
                    <div
                      key={`${c.paperId}-${c.chapterNumber}`}
                      className="flex items-center justify-between gap-4 border border-red-200 bg-red-50 rounded-lg p-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">
                          {c.paperTitle} · Chapter {c.chapterNumber}
                          {c.chapterTitle ? `: ${c.chapterTitle}` : ""}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {c.correct} of {c.total} answers right, from {c.attemptCount} {c.attemptCount === 1 ? "attempt" : "attempts"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-lg font-bold text-red-700">{c.accuracy}%</span>
                        <Link
                          href={`/exam/${c.paperId}/practice-chapter/${c.chapterNumber}`}
                          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition"
                        >
                          Practise chapter
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recs.review.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">Review soon</p>
                <ul className="divide-y divide-gray-200">
                  {recs.review.map((c: any) => (
                    <li key={`${c.paperId}-${c.chapterNumber}`} className="flex items-center justify-between gap-4 py-3">
                      <span className="text-sm text-gray-900">
                        {c.paperTitle} · Chapter {c.chapterNumber}
                      </span>
                      <span className="text-sm text-gray-600 flex-shrink-0">
                        {c.accuracy}% correct · {c.total} answers
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recs.notPractised.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Not yet practised</p>
                <ul className="space-y-2">
                  {recs.notPractised.map((p: any) => (
                    <li key={p.paperId} className="text-sm text-gray-900">
                      <span className="font-medium">{p.paperTitle}</span>
                      <span className="text-gray-600">
                        {" "}· Chapters {p.chapters.map((c: any) => c.chapterNumber).join(", ")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recs.notRankedCount > 0 && (
              <p className="text-xs text-gray-500 mt-6">
                Chapters need at least 5 answers before we rank them.
              </p>
            )}
          </div>
        )}

        {/* Attempts for one paper */}
        {openPaperId && openPaperAttempts.length > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setOpenPaperId(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="paper-attempts-title"
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-200">
                <div>
                  <h2 id="paper-attempts-title" className="text-xl font-bold text-gray-900">{openPaperTitle}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {openPaperAttempts.length} {openPaperAttempts.length === 1 ? "attempt" : "attempts"} · {openPaperPassRate}% pass rate · best {openPaperBest}%
                  </p>
                </div>
                <button
                  onClick={() => setOpenPaperId(null)}
                  aria-label="Close"
                  className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <ul className="overflow-y-auto divide-y divide-gray-100">
                {openPaperAttempts.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/exam/attempts/${a.id}`}
                      className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50 transition"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(a.submittedat).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-gray-600">{a.timeTaken} min</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${a.result === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {a.result}
                        </span>
                        <span className={`font-bold ${a.result === "Pass" ? "text-green-600" : "text-red-600"}`}>{a.score}%</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
