"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";

export default function AttemptsPage() {
  const { data: session, status } = useSession();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [papers, setPapers] = useState<any[]>([]);

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

  const filteredAttempts = Array.isArray(attempts)
    ? selectedPaperId
      ? attempts.filter((a) => a.paperid === selectedPaperId)
      : attempts
    : [];

  const handleDeleteAttempt = async (attemptId: string) => {
    try {
      const res = await fetch("/api/admin/delete-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Exam attempt deleted successfully");
        // Refresh the list
        const attemptsRes = await fetch("/api/admin/exam-attempts");
        const attemptsData = await attemptsRes.json();
        setAttempts(Array.isArray(attemptsData) ? attemptsData : []);
      } else {
        alert(data.error || "Failed to delete attempt");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting attempt");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-0">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">Exam Attempts</h1>
          <p className="text-blue-100">All student exam submissions</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filter by Paper */}
        <div className="mb-8 bg-white p-6 rounded-lg border border-gray-200">
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

        {/* Attempts Table */}
        {filteredAttempts.length === 0 ? (
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
                      Student
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
                          ? "Passed ✅"
                          : "Failed ❌"
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
                          {paper?.title || "Unknown"}
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
                                passStatus === "Passed ✅"
                                  ? "#d1fae5"
                                  : passStatus === "Failed ❌"
                                    ? "#fee2e2"
                                    : "#fef3c7",
                              color:
                                passStatus === "Passed ✅"
                                  ? "#065f46"
                                  : passStatus === "Failed ❌"
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
                              className="text-blue-600 hover:text-blue-700 font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View →
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
