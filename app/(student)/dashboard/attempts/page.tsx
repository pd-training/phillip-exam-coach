"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StudentNav from "@/components/StudentNav";

interface Attempt {
  id: string;
  paperid: string;
  paperTitle: string;
  score: number;
  result: string;
  timeTaken: number;
  submittedat: string;
}

interface QuizSession {
  id: string;
  paperId: string;
  paperTitle: string | null;
  mode: "quick" | "chapter";
  chapterNumber: number | null;
  totalQuestions: number;
  correctCount: number;
  percentage: number;
  createdAt: string;
}

type Tab = "exam" | "practice";
type SortKey = "paper" | "date" | "score";

export default function ProgressPage() {
  const router = useRouter();
  const { status } = useSession();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("exam");
  const [paperFilter, setPaperFilter] = useState<string>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "date", dir: "desc" });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/student/attempts").then((r) => (r.ok ? r.json() : { attempts: [] })),
      fetch("/api/student/quick-quiz-sessions").then((r) => (r.ok ? r.json() : { sessions: [] })),
    ])
      .then(([att, quiz]) => {
        setAttempts(att.attempts || []);
        setQuizSessions(quiz.sessions || []);
      })
      .catch((err) => console.error("Progress load error:", err))
      .finally(() => setLoading(false));
  }, [status]);

  // Papers that appear in either tab, for the filter dropdown
  const paperOptions = useMemo(() => {
    const map = new Map<string, string>();
    attempts.forEach((a) => map.set(a.paperid, a.paperTitle));
    quizSessions.forEach((q) => map.set(q.paperId, q.paperTitle || "Paper"));
    return Array.from(map.entries())
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [attempts, quizSessions]);

  const visibleAttempts = useMemo(() => {
    const rows = attempts.filter((a) => paperFilter === "all" || a.paperid === paperFilter);
    return [...rows].sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "paper") return a.paperTitle.localeCompare(b.paperTitle) * dir;
      if (sort.key === "score") return (a.score - b.score) * dir;
      return (new Date(a.submittedat).getTime() - new Date(b.submittedat).getTime()) * dir;
    });
  }, [attempts, paperFilter, sort]);

  const visibleQuizzes = useMemo(() => {
    const rows = quizSessions.filter((q) => paperFilter === "all" || q.paperId === paperFilter);
    return [...rows].sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "paper") return (a.paperTitle || "").localeCompare(b.paperTitle || "") * dir;
      if (sort.key === "score") return (a.percentage - b.percentage) * dir;
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    });
  }, [quizSessions, paperFilter, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "paper" ? "asc" : "desc" }
    );
  };

  const sortLabel = (key: SortKey) => (sort.key === key ? (sort.dir === "asc" ? " ↑" : " ↓") : "");

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentNav />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const passRate = attempts.length
    ? Math.round((attempts.filter((a) => a.result === "Pass").length / attempts.length) * 100)
    : 0;
  const avgScore = attempts.length
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
    : 0;

  const tabClass = (active: boolean) =>
    `px-4 py-2 text-sm font-semibold rounded-md transition ${
      active ? "bg-white text-blue-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
    }`;

  const sortableHeader = (key: SortKey, label: string, align: "left" | "right" = "left") => (
    <th className={`py-2 pr-4 font-semibold ${align === "right" ? "text-right" : ""}`}>
      <button type="button" onClick={() => toggleSort(key)} className="hover:text-gray-900">
        {label}
        {sortLabel(key)}
      </button>
    </th>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900">Progress</h1>
        <p className="text-gray-600 mt-1">Track your exam performance and improvement over time</p>

        {/* Tabs */}
        <div className="mt-6 inline-flex gap-1 p-1 bg-gray-100 rounded-lg">
          <button type="button" className={tabClass(tab === "exam")} onClick={() => setTab("exam")} aria-pressed={tab === "exam"}>
            Exam Simulation
          </button>
          <button type="button" className={tabClass(tab === "practice")} onClick={() => setTab("practice")} aria-pressed={tab === "practice"}>
            Practice Sessions
          </button>
        </div>

        {/* Paper filter */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-600">
            {tab === "exam"
              ? `${visibleAttempts.length} ${visibleAttempts.length === 1 ? "attempt" : "attempts"}`
              : `${visibleQuizzes.length} ${visibleQuizzes.length === 1 ? "session" : "sessions"}`}
          </p>
          <div>
            <label htmlFor="paper-filter" className="sr-only">Filter by paper</label>
            <select
              id="paper-filter"
              value={paperFilter}
              onChange={(e) => setPaperFilter(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
            >
              <option value="all">All papers</option>
              {paperOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>

        {tab === "exam" && (
          <div className="mt-4 bg-white rounded-xl border border-gray-200 p-6">
            {attempts.length > 0 && (
              <div className="grid grid-cols-3 gap-6 pb-6 mb-6 border-b border-gray-100">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Total attempts</p>
                  <p className="text-2xl font-bold text-gray-900">{attempts.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Pass rate</p>
                  <p className={`text-2xl font-bold ${passRate >= 50 ? "text-green-600" : "text-red-600"}`}>{passRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Avg score</p>
                  <p className="text-2xl font-bold text-blue-600">{avgScore}%</p>
                </div>
              </div>
            )}

            {visibleAttempts.length === 0 ? (
              <div className="py-12 text-center">
                <p className="font-semibold text-gray-900">No exam attempts yet</p>
                <p className="text-sm text-gray-600 mt-1">Your simulation exam results will show here.</p>
                <Link href="/dashboard" className="inline-block mt-5 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition">
                  Take an exam
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-600">
                      {sortableHeader("paper", "Paper")}
                      {sortableHeader("date", "Date")}
                      {sortableHeader("score", "Score", "right")}
                      <th className="py-2 pr-4 font-semibold">Result</th>
                      <th className="py-2 font-semibold text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleAttempts.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => router.push(`/exam/attempts/${a.id}`)}
                        className="border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition"
                      >
                        <td className="py-3 pr-4 font-medium text-gray-900">{a.paperTitle}</td>
                        <td className="py-3 pr-4 text-gray-700">{fmtDate(a.submittedat)}</td>
                        <td className={`py-3 pr-4 text-right font-semibold ${a.result === "Pass" ? "text-green-600" : "text-red-600"}`}>{a.score}%</td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${a.result === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {a.result}
                          </span>
                        </td>
                        <td className="py-3 text-right text-gray-700">{a.timeTaken} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "practice" && (
          <div className="mt-4 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {visibleQuizzes.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="font-semibold text-gray-900">No practice sessions yet</p>
                  <p className="text-sm text-gray-600 mt-1">Quick quiz and practice by chapter results will show here.</p>
                  <Link href="/dashboard" className="inline-block mt-5 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition">
                    Start practising
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-600">
                        {sortableHeader("paper", "Paper")}
                        <th className="py-2 pr-4 font-semibold">Mode</th>
                        {sortableHeader("date", "Date")}
                        <th className="py-2 pr-4 font-semibold text-right">Questions</th>
                        {sortableHeader("score", "Score", "right")}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleQuizzes.map((q) => (
                        <tr key={q.id} className="border-b border-gray-100">
                          <td className="py-3 pr-4 font-medium text-gray-900">{q.paperTitle || "Paper"}</td>
                          <td className="py-3 pr-4 text-gray-700">
                            {q.mode === "chapter" ? `Chapter ${q.chapterNumber}` : "Quick quiz"}
                          </td>
                          <td className="py-3 pr-4 text-gray-700">{fmtDate(q.createdAt)}</td>
                          <td className="py-3 pr-4 text-right text-gray-900">{q.totalQuestions}</td>
                          <td className={`py-3 text-right font-semibold ${q.percentage >= 50 ? "text-green-600" : "text-red-600"}`}>
                            {q.correctCount} / {q.totalQuestions} ({q.percentage}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
