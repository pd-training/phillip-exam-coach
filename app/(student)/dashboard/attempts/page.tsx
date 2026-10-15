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
  const [selectedPaper, setSelectedPaper] = useState("");
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
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

            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">By paper</h2>
              {selectedPaper && (
                <button
                  onClick={() => setSelectedPaper("")}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Show all papers
                </button>
              )}
            </div>
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
                  {sortedPaperRows.map((row) => {
                    const isSelected = selectedPaper === row.paperId;
                    return (
                      <tr
                        key={row.paperId}
                        onClick={() => setSelectedPaper(isSelected ? "" : row.paperId)}
                        className={`border-b border-gray-100 cursor-pointer transition ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                      >
                        <td className="py-3 pr-4 font-medium text-gray-900">{row.paperTitle}</td>
                        <td className="py-3 pr-4 text-right text-gray-900">{row.attempts}</td>
                        <td className={`py-3 pr-4 text-right font-semibold ${row.passRate >= 50 ? "text-green-600" : "text-red-600"}`}>{row.passRate}%</td>
                        <td className="py-3 pr-4 text-right text-gray-900">{row.avgScore}%</td>
                        <td className="py-3 text-right text-gray-900">{row.best}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-3">Click a paper to show only its attempts below.</p>
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
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
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

        {/* Filter & Sort Section */}
        {attempts.length > 0 && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Filter by Paper
              </label>
              <select
                value={selectedPaper}
                onChange={(e) => setSelectedPaper(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Papers ({attempts.length})</option>
                {Array.from(
                  attempts.reduce((map, attempt) => {
                    const count = (map.get(attempt.paperid) || 0) + 1;
                    map.set(attempt.paperid, count);
                    return map;
                  }, new Map<string, number>())
                ).map(([paperId, count]) => {
                  const paperTitle = attempts.find((a) => a.paperid === paperId)?.paperTitle || paperId;
                  return (
                    <option key={paperId} value={paperId}>
                      {paperTitle} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest score</option>
                <option value="lowest">Lowest score</option>
              </select>
            </div>
          </div>
        )}

        {attempts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-gray-600 font-medium mb-2">No exam attempts yet</p>
            <p className="text-gray-500 text-sm mb-6">
              Start practicing to see your attempts here
            </p>
            <Link href="/practice">
              <button className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
                Go to Practice
              </button>
            </Link>
          </div>
        ) : (
          <>
            {(() => {
              let filteredAttempts =
                selectedPaper === ""
                  ? attempts
                  : attempts.filter((attempt) => attempt.paperid === selectedPaper);

              // Apply sorting
              if (sortBy === 'newest') {
                filteredAttempts.sort((a, b) => new Date(b.submittedat).getTime() - new Date(a.submittedat).getTime());
              } else if (sortBy === 'oldest') {
                filteredAttempts.sort((a, b) => new Date(a.submittedat).getTime() - new Date(b.submittedat).getTime());
              } else if (sortBy === 'highest') {
                filteredAttempts.sort((a, b) => b.score - a.score);
              } else if (sortBy === 'lowest') {
                filteredAttempts.sort((a, b) => a.score - b.score);
              }

              return (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    Showing {filteredAttempts.length} of {attempts.length} attempts
                  </div>
                  <div className="space-y-3">
                    {filteredAttempts.length === 0 ? (
                      <div className="bg-white rounded-lg p-8 border border-gray-200 text-center">
                        <p className="text-gray-600">No attempts found for this paper</p>
                      </div>
                    ) : (
                      filteredAttempts.map((attempt) => (
              <Link key={attempt.id} href={`/exam/attempts/${attempt.id}`}>
                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-400 hover:shadow-md transition duration-300 cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition mb-1">
                        {attempt.paperTitle}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>
                          {new Date(attempt.submittedat).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                        <span>{attempt.timeTaken} min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div
                          className={`font-bold ${
                            attempt.result === "Pass"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {attempt.score}%
                        </div>
                        <div
                          className={`text-xs font-medium ${
                            attempt.result === "Pass"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {attempt.result}
                        </div>
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                      </Link>
                      ))
                    )}
                  </div>
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
