"use client";

import { Fragment, useEffect, useState } from "react";

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
  kind: "Full exam" | "Quick quiz";
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
  papers: PaperProgress[];
  attemptCount: number;
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

function bestText(score: number | null) {
  return score === null ? "No attempts" : `${score}%`;
}

export default function TeamOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

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

  return (
    <div>
      {/* Summary boxes */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <p className="text-gray-600 text-sm font-medium mb-2">All users</p>
          <p className="text-3xl font-bold text-gray-900">{summary.allUsers}</p>
          <p className="text-sm text-gray-600 mt-1">
            {summary.students} student{summary.students !== 1 ? "s" : ""}, {summary.admins} admin{summary.admins !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <p className="text-gray-600 text-sm font-medium mb-2">Active students</p>
          <p className="text-3xl font-bold text-gray-900">{summary.activeStudents}</p>
          <p className="text-sm text-gray-600 mt-1">
            of {summary.students} student{summary.students !== 1 ? "s" : ""} have started practicing
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <p className="text-gray-600 text-sm font-medium mb-2">Total attempts</p>
          <p className="text-3xl font-bold text-gray-900">{summary.totalAttempts}</p>
          <p className="text-sm text-gray-600 mt-1">Avg {summary.avgAttemptsPerStudent} per student</p>
        </div>
      </div>

      {/* Student progress */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900">Student progress</h2>
          <p className="text-sm text-gray-600">Select a student to see past attempts and best scores by paper.</p>
        </div>

        {data.students.length === 0 ? (
          <p className="px-6 py-8 text-gray-600 text-sm">No students yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-600">
                  <th className="px-6 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Papers assigned</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                  <th className="px-4 py-3 font-semibold text-right">Attempts</th>
                  <th className="px-6 py-3 font-semibold text-right">Last active</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((st) => {
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
                          <div className="flex flex-wrap gap-1">
                            {st.papers.length === 0 && <span className="text-gray-500">None</span>}
                            {st.papers.map((p) => (
                              <span key={p.paperId} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                                {p.title}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {st.papers.length === 0 && <span className="text-gray-500">—</span>}
                          <div className="space-y-1">
                            {st.papers.map((p) => (
                              <p key={p.paperId} className="text-xs text-gray-700">
                                {p.title}, registered {formatDate(p.registeredAt)}{" "}
                                <span className={`ml-1 px-1.5 py-0.5 rounded font-semibold ${statusClass(p.status)}`}>
                                  {p.status}
                                </span>
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-gray-900">{st.attemptCount}</td>
                        <td className="px-6 py-4 text-right text-gray-700 whitespace-nowrap">
                          {formatDate(st.lastActive)} <span className="text-blue-600 ml-1">{isOpen ? "▴" : "▾"}</span>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <td colSpan={5} className="px-6 py-5">
                            {/* Best scores by paper */}
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Best scores by paper</p>
                            {st.papers.length === 0 ? (
                              <p className="text-sm text-gray-600 mb-4">No papers assigned.</p>
                            ) : (
                              <div className="grid md:grid-cols-2 gap-3 mb-6">
                                {st.papers.map((p) => (
                                  <div key={p.paperId} className="bg-white rounded-lg border border-gray-200 p-4 text-sm">
                                    <p className="font-semibold text-gray-900 mb-2">{p.title}</p>
                                    <p className="text-gray-700">Full exam best: {bestText(p.bestFull)} <span className="text-gray-500">(pass {p.passingScore}%)</span></p>
                                    <p className="text-gray-700">Quick quiz best: {bestText(p.bestQuiz)}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Past attempts */}
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Past attempts</p>
                            {st.attempts.length === 0 ? (
                              <p className="text-sm text-gray-600">No attempts yet.</p>
                            ) : (
                              <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-200 text-left text-xs text-gray-600">
                                      <th className="px-4 py-2 font-semibold">Date</th>
                                      <th className="px-4 py-2 font-semibold">Paper</th>
                                      <th className="px-4 py-2 font-semibold">Type</th>
                                      <th className="px-4 py-2 font-semibold text-right">Score</th>
                                      <th className="px-4 py-2 font-semibold">Result</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {st.attempts.map((t, i) => {
                                      const result = t.kind === "Full exam"
                                        ? t.score >= t.passingScore ? "Passed" : "Failed"
                                        : "—";
                                      return (
                                        <tr key={i} className="border-b border-gray-100">
                                          <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{formatDate(t.date)}</td>
                                          <td className="px-4 py-2 text-gray-900">{t.title}</td>
                                          <td className="px-4 py-2 text-gray-700">{t.kind}</td>
                                          <td className="px-4 py-2 text-right text-gray-900">{t.score}%</td>
                                          <td className="px-4 py-2">
                                            {result === "—" ? (
                                              <span className="text-gray-500">—</span>
                                            ) : (
                                              <span className={result === "Passed" ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>{result}</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
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
