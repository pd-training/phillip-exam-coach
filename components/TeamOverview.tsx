"use client";

import { Fragment, useEffect, useState } from "react";

type PaperProgress = {
  paperId: string;
  title: string;
  passingScore: number;
  sim: { attempts: number; bestScore: number | null };
  prac: { attempts: number; bestScore: number | null };
};

type StudentRow = {
  id: string;
  name: string;
  email: string;
  papers: PaperProgress[];
  simAttempts: number;
  pracAttempts: number;
  lastActive: string | null;
};

type Overview = {
  summary: { students: number; started: number; simAttempts: number; notStarted: number };
  students: StudentRow[];
};

function formatDate(value: string | null) {
  if (!value) return "Not yet";
  return new Date(value).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

function scoreText(score: number | null) {
  return score === null ? "No attempts yet" : `${score}%`;
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

  return (
    <div>
        {loading && <p className="text-gray-600">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {data && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Students", value: data.summary.students, note: "Learners in the portal" },
                { label: "Started", value: data.summary.started, note: "Attempted at least one quiz or exam" },
                { label: "Full exam attempts", value: data.summary.simAttempts, note: "Across all students" },
                { label: "Not started", value: data.summary.notStarted, note: "Assigned papers with no attempts" },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-5">
                  <p className="text-sm text-gray-600">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.note}</p>
                </div>
              ))}
            </div>

            {/* Student table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Student progress</h2>
              </div>

              {data.students.length === 0 ? (
                <p className="px-6 py-8 text-gray-600 text-sm">No students yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs text-gray-600">
                        <th className="px-6 py-3 font-semibold">Student</th>
                        <th className="px-4 py-3 font-semibold">Papers</th>
                        <th className="px-4 py-3 font-semibold text-right">Full exam</th>
                        <th className="px-4 py-3 font-semibold text-right">Quick quiz</th>
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
                              className="border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition"
                            >
                              <td className="px-6 py-4">
                                <p className="font-medium text-gray-900">{st.name}</p>
                                <p className="text-xs text-gray-500">{st.email}</p>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {st.papers.length === 0 && <span className="text-gray-500">None assigned</span>}
                                  {st.papers.map((p) => (
                                    <span key={p.paperId} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                                      {p.title}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right text-gray-900">{st.simAttempts}</td>
                              <td className="px-4 py-4 text-right text-gray-900">{st.pracAttempts}</td>
                              <td className="px-6 py-4 text-right text-gray-700">
                                {formatDate(st.lastActive)} <span className="text-blue-600 ml-1">{isOpen ? "▴" : "▾"}</span>
                              </td>
                            </tr>
                            {isOpen && (
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <td colSpan={5} className="px-6 py-4">
                                  {st.papers.length === 0 ? (
                                    <p className="text-gray-600 text-sm">No papers assigned.</p>
                                  ) : (
                                    <div className="grid md:grid-cols-2 gap-4">
                                      {st.papers.map((p) => (
                                        <div key={p.paperId} className="bg-white rounded-lg border border-gray-200 p-4">
                                          <p className="font-semibold text-gray-900 mb-3">{p.title}</p>
                                          <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                              <p className="text-xs text-gray-600">Full exam</p>
                                              <p className="text-gray-900">{p.sim.attempts} attempt{p.sim.attempts !== 1 ? "s" : ""}</p>
                                              <p className={p.sim.bestScore !== null && p.sim.bestScore >= p.passingScore ? "text-green-600 font-medium" : "text-gray-900"}>
                                                Best: {scoreText(p.sim.bestScore)}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-gray-600">Quick quiz</p>
                                              <p className="text-gray-900">{p.prac.attempts} attempt{p.prac.attempts !== 1 ? "s" : ""}</p>
                                              <p className="text-gray-900">Best: {scoreText(p.prac.bestScore)}</p>
                                            </div>
                                          </div>
                                          <p className="text-xs text-gray-500 mt-3">Pass mark {p.passingScore}%</p>
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
          </>
        )}
    </div>
  );
}
