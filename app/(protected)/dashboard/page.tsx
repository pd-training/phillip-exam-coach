import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id as string },
    include: { paper: true },
    orderBy: { submittedAt: "desc" },
    take: 10,
  });

  const papers = await prisma.paper.findMany({
    where: { active: true },
  });

  const stats = {
    totalAttempts: attempts.length,
    avgScore: attempts
      .filter((a) => a.score !== null)
      .reduce((sum, a) => sum + (a.score || 0), 0) / Math.max(attempts.length, 1),
    passRate:
      (attempts.filter((a) => (a.score || 0) >= 75).length / Math.max(attempts.length, 1)) *
      100,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Nav */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Phillip Exam Coach</h1>
          <div className="flex items-center gap-4">
            <span className="text-slate-600">{user.email}</span>
            <button className="text-slate-600 hover:text-slate-900">⚙️</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Welcome, {user.name || "Student"}!</h2>
          <p className="text-slate-600">Continue your exam preparation</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
            <p className="text-slate-600 text-sm mb-2">Total Attempts</p>
            <p className="text-4xl font-bold text-blue-700">{stats.totalAttempts}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
            <p className="text-slate-600 text-sm mb-2">Average Score</p>
            <p className="text-4xl font-bold text-indigo-700">
              {stats.avgScore.toFixed(1)}%
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
            <p className="text-slate-600 text-sm mb-2">Pass Rate</p>
            <p className="text-4xl font-bold text-emerald-600">{stats.passRate.toFixed(0)}%</p>
          </div>
        </div>

        {/* Exams Grid */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 text-slate-900">Available Exams</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {papers.map((paper) => {
              const lastAttempt = attempts.find((a) => a.paperId === paper.id);
              return (
                <div key={paper.id} className="bg-white p-6 rounded-lg shadow border border-slate-200 hover:shadow-lg transition">
                  <h4 className="font-bold text-lg mb-2 text-slate-900">{paper.title}</h4>
                  <p className="text-slate-600 text-sm mb-4">
                    {paper.durationMinutes} min • {paper.totalQuestions} questions
                  </p>
                  {lastAttempt?.score !== null && (
                    <div className="bg-blue-50 p-3 rounded mb-4">
                      <p className="text-sm text-slate-600">Best Score</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {lastAttempt?.score}%
                      </p>
                    </div>
                  )}
                  <Link href={`/practice/${paper.id}`}>
                    <button className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded transition">
                      {lastAttempt ? "Retake" : "Start Practice"}
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Results */}
        {attempts.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold mb-6 text-slate-900">Recent Results</h3>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">Paper</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">Score</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.slice(0, 5).map((attempt) => (
                    <tr key={attempt.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm text-slate-600">
                        {attempt.submittedAt?.toLocaleDateString() || "In Progress"}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-slate-900">
                        {attempt.paper.title}
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-slate-900">
                        {attempt.score?.toFixed(1) || "—"}%
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            (attempt.score || 0) >= 75
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {(attempt.score || 0) >= 75 ? "PASS" : "FAIL"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
