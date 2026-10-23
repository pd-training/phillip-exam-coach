"use client";

import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";

export default function AttemptsPage() {
  const { showToast, ToastView } = useToast();
  const { data: session, status } = useSession();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentSort, setStudentSort] = useState<"asc" | "desc" | null>(null);
  const [papers, setPapers] = useState<any[]>([]);
  const [view, setView] = useState<"exam" | "practice">("exam");
  const [practiceRuns, setPracticeRuns] = useState<any[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }

    if ((session?.user as any)?.role !== "ADMIN") {
      redirect("/dashboard");
    }

    const fetchData = async () => {
      try {
        // Fetch papers
        const papersRes = await fetch("/api/papers");
        const papersData = await papersRes.json();
        setPapers(papersData?.papers || []);

        // Fetch all attempts
        const attemptsRes = await fetch("/api/admin/exam-attempts");
        const attemptsData = await attemptsRes.json();
        setAttempts(Array.isArray(attemptsData) ? attemptsData : []);

        // Practice runs (quick quiz, chapter and full practice)
        const runsRes = await fetch("/api/admin/practice-runs");
        const runsData = await runsRes.json();
        setPracticeRuns(Array.isArray(runsData?.runs) ? runsData.runs : []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setPapers([]);
        setAttempts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, status]);

  if (status === "loading" || loading) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  const studentLabel = (a: any) => a.username || a.email || a.userid || "";

  let filteredAttempts: any[] = Array.isArray(attempts)
    ? selectedPaperId
      ? attempts.filter((a) => a.paperid === selectedPaperId)
      : attempts
    : [];

  const term = studentSearch.trim().toLowerCase();
  if (term) {
    filteredAttempts = filteredAttempts.filter(
      (a) =>
        (a.username || "").toLowerCase().includes(term) ||
        (a.email || "").toLowerCase().includes(term)
    );
  }

  if (studentSort) {
    filteredAttempts = [...filteredAttempts].sort((a, b) => {
      const cmp = studentLabel(a).localeCompare(studentLabel(b), undefined, { sensitivity: "base" });
      return studentSort === "asc" ? cmp : -cmp;
    });
  }

  // Practice runs follow the same paper and student filters
  const practiceFiltered = practiceRuns
    .filter((r) => !selectedPaperId || r.paperId === selectedPaperId)
    .filter((r) => {
      const t = studentSearch.trim().toLowerCase();
      if (!t) return true;
      return (r.studentName || "").toLowerCase().includes(t) || (r.studentEmail || "").toLowerCase().includes(t);
    });

  const practiceLabel = (r: any) =>
    r.mode === "chapter" ? `Chapter ${r.chapterNumber}` : r.mode === "full" ? "Full practice" : "Quick quiz";

  const toggleStudentSort = () => {
    setStudentSort((prev) => (prev === null ? "asc" : prev === "asc" ? "desc" : null));
  };

  const handleDeleteAttempt = async (attemptId: string) => {
    try {
      const res = await fetch("/api/admin/delete-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Exam attempt deleted successfully");
        // Refresh the list
        const attemptsRes = await fetch("/api/admin/exam-attempts");
        const attemptsData = await attemptsRes.json();
        setAttempts(Array.isArray(attemptsData) ? attemptsData : []);
      } else {
        showToast(data.error || "Failed to delete attempt");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showToast("Error deleting attempt");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      {ToastView}
      <div className="max-w-7xl mx-auto px-6 pt-10">
<h1 className="text-3xl font-bold text-gray-900">Exam Attempts</h1>
<p className="text-gray-600 mt-1">All student exam submissions and practice runs</p>
</div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* View switch */}
        <div className="mb-6 inline-flex gap-1 p-1 bg-gray-100 rounded-lg">
          {(["exam", "practice"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
                view === v ? "bg-white text-blue-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {v === "exam" ? "Exam simulations" : "Practice runs"}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white p-6 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Filter by Paper
            </label>
            <select
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Papers</option>
              {Array.isArray(papers) && papers.map((paper) => (
                <option key={paper.id} value={paper.id}>
                  {paper.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Filter by Student
            </label>
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Attempts Table */}
        {view === "practice" ? (
          practiceFiltered.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600">No practice runs found</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Paper</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Mode</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Score</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {practiceFiltered.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">
                          <p className="font-medium text-gray-900">{r.studentName || "No name"}</p>
                          <p className="text-gray-500 text-xs">{r.studentEmail}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{r.paperShortName || r.paperTitle || "Paper"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{practiceLabel(r)}</td>
                        <td className={`px-6 py-4 text-sm font-semibold ${r.percentage >= 50 ? "text-green-700" : "text-red-600"}`}>
                          {r.correctCount} / {r.totalQuestions} ({r.percentage}%)
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {new Date(r.createdAt).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Link href={`/admin/practice-runs/${r.id}`} className="font-medium text-blue-700 hover:text-blue-800">
                            Review →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : filteredAttempts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600">No exam attempts found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      <button
                        onClick={toggleStudentSort}
                        className="inline-flex items-center gap-1 hover:text-blue-900"
                        title="Sort by student"
                      >
                        Student
                        <span className="text-xs text-gray-500">
                          {studentSort === "asc" ? "▲" : studentSort === "desc" ? "▼" : "↕"}
                        </span>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Paper
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.isArray(filteredAttempts) ? filteredAttempts.map((attempt, idx) => {
                    const paper = papers.find((p) => p.id === attempt.paperid);
                    const passStatus =
                      attempt.passed !== null
                        ? attempt.passed
                          ? "Passed"
                          : "Failed"
                        : "In Progress";
                    const submittedDate = attempt.submittedat
                      ? new Date(attempt.submittedat).toLocaleDateString()
                      : "Not submitted";

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() =>
                          window.location.href =
                            `/admin/attempts/${attempt.id}`
                        }
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {attempt.username || attempt.userid}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {paper?.shortName || paper?.title || "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold">
                          {attempt.score !== null ? `${attempt.score}%` : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 12px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "600",
                              backgroundColor:
                                passStatus === "Passed"
                                  ? "#d1fae5"
                                  : passStatus === "Failed"
                                    ? "#fee2e2"
                                    : "#fef3c7",
                              color:
                                passStatus === "Passed"
                                  ? "#065f46"
                                  : passStatus === "Failed"
                                    ? "#991b1b"
                                    : "#92400e",
                            }}
                          >
                            {passStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {submittedDate}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Link href={`/admin/attempts/${attempt.id}`}>
                            <button
                              className="font-medium"
                              style={{
                                color: "#f59e0b",
                                backgroundColor: "transparent",
                                border: "none",
                                cursor: "pointer",
                                transition: "color 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = "#d97706";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = "#f59e0b";
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              View
                            </button>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Are you sure you want to delete this exam attempt?")) {
                                handleDeleteAttempt(attempt.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                  : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-600">
                        No attempts found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-sm text-gray-600">
              Showing {Array.isArray(filteredAttempts) ? filteredAttempts.length : 0} of {Array.isArray(attempts) ? attempts.length : 0} attempts
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
