"use client";

import StudentNav from "@/components/StudentNav";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";


interface AttemptStats {
  completedCount: number;
  averageScore: number;
  passCount: number;
}

interface RecommendedChapter {
  id: string;
  paperTitle: string;
  paperId: string;
  chapterNumber: number;
  chapterTitle: string;
  weaknessScore: number;
  scoreOnPaper: number;
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
  const [recommendedChapters, setRecommendedChapters] = useState<RecommendedChapter[]>([]);
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
        const [attemptsRes, recommendationsRes] = await Promise.all([
          fetch("/api/student/attempts"),
          fetch("/api/student/recommendations"),
        ]);

        console.log("API Responses:", {
          attempts: attemptsRes.status,
          recommendations: recommendationsRes.status,
        });

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

        if (recommendationsRes.ok) {
          const data = await recommendationsRes.json();
          setRecommendedChapters(data.recommendations || []);
        } else {
          console.error("Failed to fetch recommendations:", recommendationsRes.status);
          // Don't break the page if recommendations fail
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
                      View all {attempts.length} attempts →
                    </button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* AI Recommendations Section */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Focus Areas for Improvement
                </h2>
              </div>
              <p className="text-gray-600">
                Based on your exam performance, focus on these chapters
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading recommendations...</p>
            </div>
          ) : stats.completedCount === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">No recommendations yet</p>
              <p className="text-gray-500 text-sm">
                Complete your first practice exam to get AI-powered recommendations
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedChapters.map((chapter, idx) => (
                <div
                  key={chapter.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition duration-200 group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center font-bold text-gray-600 group-hover:border-blue-500 group-hover:text-blue-600 transition">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {chapter.paperTitle} - {chapter.chapterTitle}
                      </p>
                      <p className="text-sm text-gray-600">
                        Chapter {chapter.chapterNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600">
                        {Math.round(100 - chapter.weaknessScore)}% correct
                      </div>
                      <div className="w-32 h-2 bg-gray-300 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                          style={{ width: `${Math.round(100 - chapter.weaknessScore)}%` }}
                        />
                      </div>
                    </div>
                    <Link href={`/exam/${chapter.paperId}/practice-chapter/${chapter.chapterNumber}`}>
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition">
                        Practice
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
