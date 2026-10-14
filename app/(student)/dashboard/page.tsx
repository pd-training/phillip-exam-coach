"use client";

import StudentNav from "@/components/StudentNav";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";


interface AttemptStats {
  completedCount: number;
  averageScore: number;
  passCount: number;
}

interface Attempt {
  id: string;
  paperid: string;
  paperTitle: string;
  score: number;
  result: string;
  timeTaken: number;
  submittedat: string;
}

interface Paper {
  id: string;
  title: string;
  externalLink?: string;
  totalTime: number;
}

interface StudentPaper {
  id: string;
  paperId: string;
  paper_name: string;
  status: string;
}

interface PaperRequest {
  id: string;
  paperId: string;
  paper_name: string;
  status: string;
  requestedAt: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [stats, setStats] = useState<AttemptStats>({
    completedCount: 0,
    averageScore: 0,
    passCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState<string>("all");
  const [selectedTrendPaper, setSelectedTrendPaper] = useState<string>("");
  const [availablePapers, setAvailablePapers] = useState<Paper[]>([]);
  const [studentPapers, setStudentPapers] = useState<StudentPaper[]>([]);
  const [requests, setRequests] = useState<PaperRequest[]>([]);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitMessages, setSubmitMessages] = useState<{ [key: string]: string }>({});

  // Handle auth redirects
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" || !session?.user) {
      router.push("/login");
      return;
    }

    if ((session?.user as any)?.role === "ADMIN") {
      router.push("/admin/dashboard");
      return;
    }
  }, [status, session?.user?.email, (session?.user as any)?.role]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-amber-500 rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session?.user || (session?.user as any)?.role === "ADMIN") {
    return null;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attemptsRes, papersRes, studentPapersRes, requestsRes] = await Promise.all([
          fetch("/api/student/attempts"),
          fetch("/api/papers/available"),
          fetch("/api/student/papers"),
          fetch("/api/student/paper-requests")
        ]);

        console.log("API Response - attempts:", attemptsRes.status);

        if (attemptsRes.ok) {
          const data = await attemptsRes.json();
          setStats(data.stats || {
            completedCount: 0,
            averageScore: 0,
            passCount: 0,
          });
          setAttempts(data.attempts || []);
        } else {
          console.error("Failed to fetch attempts:", attemptsRes.status);
        }

        if (papersRes.ok) {
          const papersData = await papersRes.json();
          setAvailablePapers(papersData.papers || []);
        } else {
          console.error("Failed to fetch papers:", papersRes.status);
        }

        if (studentPapersRes.ok) {
          const studentPapersData = await studentPapersRes.json();
          setStudentPapers(studentPapersData.papers || []);
        } else {
          console.error("Failed to fetch student papers:", studentPapersRes.status);
        }

        if (requestsRes.ok) {
          const requestsData = await requestsRes.json();
          setRequests(requestsData.requests || []);
        } else {
          console.error("Failed to fetch requests:", requestsRes.status);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Initialize selectedTrendPaper to the first paper attempted
  useEffect(() => {
    if (attempts.length > 0 && !selectedTrendPaper) {
      const firstPaper = attempts[0].paperTitle;
      setSelectedTrendPaper(firstPaper);
    }
  }, [attempts, selectedTrendPaper]);

  const getStatusForPaper = (paperId: string) => {
    const ownsPaper = studentPapers.some((p) => p.paperId === paperId);
    if (ownsPaper) return 'owned';

    const hasRequest = requests.find((r) => r.paperId === paperId);
    if (hasRequest) return hasRequest.status; // 'pending', 'approved', 'rejected'

    return 'available';
  };

  const handleRequestPaper = useCallback(async (paperId: string, paperName: string) => {
    try {
      setSubmitting(paperId);

      const res = await fetch('/api/student/paper-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setSubmitMessages((prev) => ({
          ...prev,
          [paperId]: errData.error || 'Failed to submit request',
        }));
        return;
      }

      setSubmitMessages((prev) => ({
        ...prev,
        [paperId]: 'Request submitted!',
      }));

      // Refresh data after 1 second
      setTimeout(async () => {
        try {
          const [studentPapersRes, requestsRes] = await Promise.all([
            fetch("/api/student/papers"),
            fetch("/api/student/paper-requests")
          ]);

          if (studentPapersRes.ok && requestsRes.ok) {
            const studentPapersData = await studentPapersRes.json();
            const requestsData = await requestsRes.json();

            setStudentPapers(studentPapersData.papers || []);
            setRequests(requestsData.requests || []);
          }
        } catch (err) {
          console.error('Error refreshing data:', err);
        }
      }, 1000);
    } catch (err: any) {
      setSubmitMessages((prev) => ({
        ...prev,
        [paperId]: err.message || 'Failed to submit request',
      }));
    } finally {
      setSubmitting(null);
    }
  }, []);

  const passRate =
    stats.completedCount > 0
      ? Math.round((stats.passCount / stats.completedCount) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12 px-0">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">Your Practice Dashboard</h1>
          <p className="text-blue-100">Track your progress and prepare for certification exams</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* New User Welcome Banner */}
        {attempts.length === 0 && studentPapers.length === 0 && (
          <div className="mb-12 bg-gradient-to-r from-blue-50 to-amber-50 border-2 border-blue-200 rounded-lg p-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Finance Ready! 👋</h2>
                <p className="text-gray-700 mb-4">
                  Get ready for your certification exams with our comprehensive practice platform.
                </p>
                <div className="space-y-2 text-sm text-gray-700 mb-6">
                  <p><span className="font-semibold">📋 Step 1:</span> Request access to papers in the Explore section</p>
                  <p><span className="font-semibold">✅ Step 2:</span> Wait for admin approval (or get instant access if pre-assigned)</p>
                  <p><span className="font-semibold">📚 Step 3:</span> Start practicing with Full Exam, Quick Quiz, or Chapter modes</p>
                  <p><span className="font-semibold">📊 Step 4:</span> Track your progress and focus on weak areas</p>
                </div>
                <Link href="/explore">
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">
                    Browse Papers & Request Access →
                  </button>
                </Link>
              </div>
              <div className="hidden md:block text-6xl">🚀</div>
            </div>
          </div>
        )}

        {/* Your Papers - Quick Access */}
        {studentPapers.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Papers</h2>
              <Link href="/explore" className="text-amber-600 hover:text-amber-700 font-medium text-sm">
                View all →
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {studentPapers.slice(0, 4).map((paper) => {
                const paperAttempts = attempts.filter((a) => a.paperid === paper.paperId);
                const latestAttempt = paperAttempts.length > 0
                  ? paperAttempts.sort((a, b) => new Date(b.submittedat).getTime() - new Date(a.submittedat).getTime())[0]
                  : null;
                const isPassed = latestAttempt?.result === 'Pass';

                return (
                  <div
                    key={paper.id}
                    className="bg-white rounded-lg border-2 border-amber-200 p-5 hover:shadow-lg transition"
                  >
                    <h3 className="font-bold text-gray-900 mb-3 line-clamp-2">
                      {paper.paper_name}
                    </h3>
                    {latestAttempt ? (
                      <>
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-600">Latest</span>
                            <span className={`text-sm font-bold ${isPassed ? 'text-green-600' : 'text-amber-600'}`}>
                              {latestAttempt.score}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${isPassed ? 'bg-green-500' : 'bg-amber-500'}`}
                              style={{ width: `${latestAttempt.score}%` }}
                            />
                          </div>
                        </div>
                        <Link href={`/exam/${paper.paperId}`}>
                          <button className="w-full px-3 py-2 bg-amber-500 hover:bg-amber-600 text-blue-900 rounded-lg font-medium text-sm transition">
                            Practice Again →
                          </button>
                        </Link>
                      </>
                    ) : (
                      <Link href={`/exam/${paper.paperId}`}>
                        <button className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition">
                          Start →
                        </button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Secondary Stats Row - Only show if user has attempts */}
        {attempts.length > 0 && (
          <div className="flex gap-6 mb-8 text-sm">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-gray-500 text-xs font-medium">Overall Average</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.completedCount > 0 ? `${Math.round(stats.averageScore)}%` : "—"}
                </p>
              </div>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-gray-500 text-xs font-medium">Pass Rate</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.completedCount > 0 ? `${passRate}%` : "—"}
                </p>
              </div>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-gray-500 text-xs font-medium">Attempts</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.completedCount}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Latest Scores & Trend Analysis */}
        {attempts.length > 0 && (() => {
          // Get unique papers with latest score
          const paperMap = new Map<string, { latest: Attempt; count: number }>();

          attempts.forEach((attempt) => {
            const existing = paperMap.get(attempt.paperTitle);
            if (!existing) {
              paperMap.set(attempt.paperTitle, { latest: attempt, count: 1 });
            } else {
              existing.count += 1;
              // Keep the most recent attempt
              if (new Date(attempt.submittedat) > new Date(existing.latest.submittedat)) {
                existing.latest = attempt;
              }
            }
          });

          const papersList = Array.from(paperMap.entries()).map(([title, data]) => ({
            title,
            latest: data.latest,
            count: data.count,
          })).sort((a, b) => new Date(b.latest.submittedat).getTime() - new Date(a.latest.submittedat).getTime());

          // Get trend data for selected paper
          const selectedPaperAttempts = attempts.filter((a) => a.paperTitle === selectedTrendPaper);
          const trendData = [...selectedPaperAttempts]
            .sort((a, b) => new Date(a.submittedat).getTime() - new Date(b.submittedat).getTime())
            .map((attempt, index) => {
              const attemptDate = new Date(attempt.submittedat);
              const score = attempt.score ? Math.max(0, Math.min(100, Math.round(attempt.score))) : 0;
              return {
                id: attempt.id,
                attemptNumber: index + 1,
                paper: attempt.paperTitle || "Unknown Paper",
                date: attemptDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                time: attemptDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                score: score,
                passed: attempt.result === "Pass" ? "✓" : "✗",
              };
            });

          return (
            <>
              {/* Latest Scores Cards */}
              <div className="mb-12">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Your Latest Scores</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {papersList.map((paper) => {
                    const score = paper.latest.score;
                    const isPassed = paper.latest.result === "Pass";
                    const paperId = paper.latest.paperid;
                    return (
                      <div
                        key={paper.title}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedTrendPaper === paper.title
                            ? "border-amber-500 bg-amber-50"
                            : "border-gray-200 bg-white hover:border-amber-200"
                        }`}
                      >
                        <button
                          onClick={() => setSelectedTrendPaper(paper.title)}
                          className="w-full text-left mb-3"
                        >
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            {paper.title}
                          </div>
                          <div className="text-2xl font-bold text-gray-900 mb-2">
                            {Math.round(score)}%
                          </div>
                          <div className={`inline-block text-xs font-semibold px-2 py-1 rounded ${
                            isPassed
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {isPassed ? "✓ Passed" : "Failed"}
                          </div>
                        </button>
                        <Link href={`/exam/${paperId}`}>
                          <button className="w-full mt-3 px-2 py-1.5 bg-amber-500 hover:bg-amber-600 text-blue-900 rounded text-xs font-semibold transition">
                            Practice Again
                          </button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trend Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Progress</h2>
                  <p className="text-gray-600 text-sm">
                    📈 {selectedTrendPaper} — {trendData.length} attempt{trendData.length !== 1 ? "s" : ""} (click a paper above to change)
                  </p>
                </div>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="attemptNumber"
                        label={{ value: "Attempt", position: "insideBottomRight", offset: -5, fontSize: 12 }}
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                        label={{ value: "Score (%)", angle: -90, position: "insideLeft" }}
                        stroke="#9ca3af"
                      />
                      <Tooltip
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div style={{ padding: "10px 12px", backgroundColor: "#ffffff", border: "1px solid #d1d5db", borderRadius: "6px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                                <p style={{ margin: "0 0 3px 0", fontSize: "12px", color: "#374151" }}>
                                  <strong>Attempt #{data.attemptNumber}</strong>
                                </p>
                                <p style={{ margin: "0 0 3px 0", fontSize: "12px", color: "#374151" }}>
                                  Score: <strong style={{ fontSize: "14px" }}>{data.score}%</strong> {data.passed}
                                </p>
                                <p style={{ margin: "0", fontSize: "11px", color: "#6b7280" }}>
                                  {data.date} at {data.time}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{ fill: "#f59e0b", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          );
        })()}

        {/* Get Started Section for New Users */}
        {attempts.length === 0 && (
          <div className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Available Papers</h2>
                <p className="text-gray-600 text-sm">Request access or start practicing with papers</p>
              </div>
              <Link href="/explore" className="text-amber-600 hover:text-amber-700 font-semibold">
                View All →
              </Link>
            </div>
            {availablePapers.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
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
                <p className="text-gray-700 font-medium mb-2">No papers available yet</p>
                <p className="text-gray-600 text-sm mb-6">
                  Check back soon! Your admin is preparing papers for you.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availablePapers.slice(0, 6).map((paper) => {
                const status = getStatusForPaper(paper.id);
                const msg = submitMessages[paper.id];

                return (
                  <div
                    key={paper.id}
                    className="bg-white rounded-lg p-5 border border-gray-200 hover:border-amber-400 hover:shadow-md transition duration-300"
                  >
                    <h3 className="font-semibold text-gray-900 mb-4">
                      {paper.title}
                    </h3>
                    <div className="flex flex-col gap-3">
                      {status === 'owned' && (
                        <Link href={`/exam/${paper.id}/full-exam`}>
                          <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-center text-sm">
                            Practice →
                          </button>
                        </Link>
                      )}

                      {status === 'available' && (
                        <>
                          <button
                            onClick={() =>
                              handleRequestPaper(paper.id, paper.title)
                            }
                            disabled={submitting === paper.id}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:bg-gray-300"
                          >
                            {submitting === paper.id ? 'Requesting...' : 'Request Access'}
                          </button>
                          {msg && (
                            <p className="text-xs text-green-600 font-medium text-center">
                              {msg}
                            </p>
                          )}
                        </>
                      )}

                      {status === 'pending' && (
                        <span className="w-full px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium text-center">
                          ⏳ Pending
                        </span>
                      )}

                      {status === 'approved' && (
                        <span className="w-full px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium text-center">
                          ✓ Approved
                        </span>
                      )}

                      {status === 'rejected' && (
                        <span className="w-full px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium text-center">
                          ✗ Rejected
                        </span>
                      )}

                      {paper.externalLink && (
                        <a
                          href={paper.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium text-center transition"
                        >
                          Learn more →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
          </div>
        )}

        {/* Recent Exam Attempts Section */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Recent Exam Attempts</h2>
            <p className="text-gray-600 text-sm">
              {attempts.length === 0
                ? "No completed attempts yet"
                : `${attempts.length} exam${attempts.length !== 1 ? "s" : ""} completed`}
            </p>
          </div>

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
              <p className="text-gray-600 font-medium mb-2">No completed attempts</p>
              <p className="text-gray-500 text-sm">
                Complete your first full exam to review your performance
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {attempts.slice(0, 5).map((attempt) => (
                  <div key={attempt.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition duration-300">
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Attempt Details */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/exam/attempts/${attempt.id}`}>
                          <h3 className="font-semibold text-gray-900 hover:text-amber-600 transition mb-1 cursor-pointer">
                            {attempt.paperTitle}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>
                            {new Date(attempt.submittedat).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span>{attempt.timeTaken} min</span>
                        </div>
                      </div>

                      {/* Middle: Score */}
                      <div className="text-right flex-shrink-0">
                        <div className={`font-bold ${
                          attempt.result === 'Pass' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {attempt.score}%
                        </div>
                        <div className={`text-xs font-medium ${
                          attempt.result === 'Pass' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {attempt.result}
                        </div>
                      </div>

                      {/* Right: Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link href={`/exam/attempts/${attempt.id}`}>
                          <button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                            Review
                          </button>
                        </Link>
                        <Link href={`/exam/${attempt.paperid}`}>
                          <button className="px-3 py-1.5 text-sm font-medium text-blue-900 bg-amber-500 hover:bg-amber-600 rounded-lg transition">
                            Again
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {attempts.length > 5 && (
                <div className="mt-4 text-center">
                  <Link href="/dashboard/attempts">
                    <button className="text-amber-600 hover:text-amber-700 font-medium text-sm">
                      View all attempts →
                    </button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* AI Recommended Focus Areas moved to individual paper pages */}
        {/* Students can view per-paper focus areas after completing their first full exam attempt on each paper */}

      </div>
    </div>
  );
}
