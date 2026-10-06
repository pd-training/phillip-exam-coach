"use client";

import StudentNav from "@/components/StudentNav";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
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
        const attemptsRes = await fetch("/api/student/attempts");

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
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const passRate =
    stats.completedCount > 0
      ? Math.round((stats.passCount / stats.completedCount) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-0">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">Welcome, {session?.user?.name || "Student"}!</h1>
          <p className="text-blue-100">Your CMFAS exam preparation dashboard</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Compact Stats Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Average Score */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Average Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.completedCount > 0 ? `${Math.round(stats.averageScore)}%` : "—"}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Pass Rate */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pass Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.completedCount > 0 ? `${passRate}%` : "—"}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-emerald-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M10 15.172l9.192-9.193a1 1 0 111.415 1.415l-10.606 10.606a1 1 0 01-1.415 0l-5.656-5.657a1 1 0 111.415-1.415l4.243 4.242z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Score Trend Chart */}
        {attempts.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Score Trend</h2>
            <p className="text-gray-600 text-sm mb-1">Your exam performance across all papers</p>
            <p className="text-gray-500 text-xs mb-6">Attempts are numbered chronologically (1 = oldest, N = newest). Hover over each point to see paper name and timestamp.</p>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...attempts].reverse().map((attempt, index) => {
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
                    displayLabel: `${attemptDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${attempt.paperTitle}`
                  };
                })}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="attemptNumber"
                    label={{ value: "Attempt #", position: "insideBottomRight", offset: -5, fontSize: 12 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    label={{ value: "Score (%)", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip 
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const score = data.score;
                        return (
                          <div style={{ padding: "10px 12px", backgroundColor: "#ffffff", border: "1px solid #d1d5db", borderRadius: "6px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                            <p style={{ margin: "0 0 6px 0", fontSize: "13px", fontWeight: "700", color: "#1f2937" }}>
                              {data.paper}
                            </p>
                            <p style={{ margin: "0 0 3px 0", fontSize: "12px", color: "#374151" }}>
                              <strong>Attempt #{data.attemptNumber}</strong>
                            </p>
                            <p style={{ margin: "0 0 3px 0", fontSize: "12px", color: "#374151" }}>
                              Score: <strong style={{ fontSize: "14px" }}>{score}%</strong> {data.passed}
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
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
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
                  <Link key={attempt.id} href={`/exam/attempts/${attempt.id}`}>
                    <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition duration-300 cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition mb-1">
                            {attempt.paperTitle}
                          </h3>
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
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
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
                ))}
              </div>
              
              {attempts.length > 5 && (
                <div className="mt-4 text-center">
                  <Link href="/dashboard/attempts">
                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
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
