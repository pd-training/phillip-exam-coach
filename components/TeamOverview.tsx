"use client";

import { Fragment, ReactNode, useEffect, useState } from "react";
import Link from "next/link";

type PaperProgress = {
  paperId: string;
  title: string;
  passingScore: number;
  registeredAt: string | null;
  status: "Passed" | "Failed" | "Not started";
  bestFull: number | null;
  bestQuiz: number | null;
};

type Attempt = {
  kind: "Full exam" | "Quick quiz" | "Full practice";
  paperId: string;
  title: string;
  score: number;
  passingScore: number;
  date: string;
};

type StudentRow = {
  id: string;
  name: string;
  email: string;
  remarks: string;
  papers: PaperProgress[];
  attemptCount: number;
  examAttemptCount: number;
  practiceAttemptCount: number;
  lastActive: string | null;
  attempts: Attempt[];
};

type Overview = {
  summary: {
    allUsers: number;
    students: number;
    admins: number;
    activeStudents: number;
    totalAttempts: number;
    avgAttemptsPerStudent: number;
  };
  students: StudentRow[];
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

function statusClass(status: PaperProgress["status"]) {
  if (status === "Passed") return "text-green-700 bg-green-50";
  if (status === "Failed") return "text-red-700 bg-red-50";
  return "text-gray-600 bg-gray-100";
}

function cardBorder(status: PaperProgress["status"]) {
  if (status === "Passed") return "border-green-500";
  if (status === "Failed") return "border-red-500";
  return "border-gray-300";
}

function scoreColour(status: PaperProgress["status"]) {
  if (status === "Passed") return "text-green-700";
  if (status === "Failed") return "text-red-700";
  return "text-gray-600";
}

function bestText(score: number | null) {
  return score === null ? "No attempts" : `${score}%`;
}

export default function TeamOverview({ sideCard }: { sideCard?: ReactNode }) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/admin/team-overview")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Could not load overview");
        setData(body);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-600">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  const { summary } = data;
  const term = query.trim().toLowerCase();
  const visibleStudents = term
    ? data.students.filter(
        (st) => st.name.toLowerCase().includes(term) || st.email.toLowerCase().includes(term)
      )
    : data.students;

  return (
    <div>
      {/* Summary boxes */}
      <div className={`grid md:grid-cols-2 gap-6 mb-8 ${sideCard ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        <Link href="/admin/users" className="block bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 transition">
          <p className="text-gray-600 text-sm font-medium mb-2">All users</p>
          <p className="text-3xl font-bold text-gray-900">{summary.allUsers}</p>
          <p className="text-sm text-gray-600 mt-1">
            {summary.students} student{summary.students !== 1 ? "s" : ""}, {summary.admins} admin{summary.admins !== 1 ? "s" : ""}
          </p>
        </Link>
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <p className="text-gray-600 text-sm font-medium mb-2">Active students</p>
          <p className="text-3xl font-bold text-gray-900">{summary.activeStudents}</p>
          <p className="text-sm text-gray-600 mt-1">
            of {summary.students} student{summary.students !== 1 ? "s" : ""} have started practicing
          </p>
        </div>
        <Link href="/admin/attempts" className="block bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 transition">
          <p className="text-gray-600 text-sm font-medium mb-2">Total attempts</p>
          <p className="text-3xl font-bold text-gray-900">{summary.totalAttempts}</p>
          <p className="text-sm text-gray-600 mt-1">Avg {summary.avgAttemptsPerStudent} per student</p>
        </Link>
        {sideCard}
      </div>

      {/* Student progress */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900">Student progress</h2>
          <p className="text-sm text-gray-600">Select a student to see past attempts and best scores by paper.</p>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            aria-label="Search students"
            className="mt-3 w-full md:w-80 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
          />
        </div>

        {data.students.length === 0 ? (
          <p className="px-6 py-8 text-gray-600 text-sm">No students yet.</p>
        ) : visibleStudents.length === 0 ? (
          <p className="px-6 py-8 text-gray-600 text-sm">No students match &ldquo;{query}&rdquo;.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-600">
                  <th className="px-6 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Papers assigned</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                  <th className="px-4 py-3 font-semibold text-right">Exam attempts</th>
                  <th className="px-4 py-3 font-semibold text-right">Practice attempts</th>
                  <th className="px-6 py-3 font-semibold text-right">Last active</th>
                </tr>
              </thead>
              <tbody>
                {visibleStudents.map((st) => {
                  const isOpen = openId === st.id;
                  return (
                    <Fragment key={st.id}>
                      <tr
                        onClick={() => setOpenId(isOpen ? null : st.id)}
                        className="border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition align-top"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{st.name}</p>
                          <p className="text-xs text-gray-500">{st.email}</p>
                        </td>
                        <td className="px-4 py-4">
                          {st.papers.length === 0 && <span className="text-gray-500">None assigned</span>}
                          <div className="flex flex-wrap gap-2">
                            {st.papers.map((p) => (
                              <span
                                key={p.paperId}
                                className="px-3 py-1.5 rounded-full border border-gray-300 bg-gray-50 text-gray-800 text-xs font-medium leading-none whitespace-nowrap"
                              >
                                {p.title}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-700 whitespace-pre-wrap max-w-xs">
                          {st.remarks ? st.remarks : <span className="text-gray-400">No notes</span>}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-900">{st.examAttemptCount}</td>
                        <td className="px-4 py-4 text-right text-gray-900">{st.practiceAttemptCount}</td>
                        <td className="px-6 py-4 text-right text-gray-700 whitespace-nowrap">
                          {formatDate(st.lastActive)} <span className="text-blue-600 ml-1">{isOpen ? "▴" : "▾"}</span>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <td colSpan={6} className="px-6 py-5">
                            {/* Best scores by paper, colour coded by status */}
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Best scores by paper</p>
                            {st.papers.length === 0 ? (
                              <p className="text-sm text-gray-600">No papers assigned.</p>
                            ) : (
                              <div className="grid md:grid-cols-2 gap-3">
                                {st.papers.map((p) => (
                                  <div key={p.paperId} className={`rounded-lg border-2 bg-white p-4 text-sm ${cardBorder(p.status)}`}>
                                    <p className="font-semibold text-gray-900 mb-2">{p.title}</p>
                                    <p className="text-gray-700">
                                      Full exam best:{" "}
                                      <span className={`font-semibold ${scoreColour(p.status)}`}>{bestText(p.bestFull)}</span>
                                      <span className="text-gray-500"> (pass {p.passingScore}%)</span>
                                    </p>
                                    <p className="text-gray-700">Quick quiz best: {bestText(p.bestQuiz)}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
