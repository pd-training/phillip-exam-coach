"use client";

import StudentNav from "@/components/StudentNav";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Paper {
  id: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  createdAt: string;
}

interface AttemptStats {
  completedCount: number;
  averageScore: number;
  passCount: number;
}

interface RecommendedChapter {
  id: string;
  paperTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  weaknessScore: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [stats, setStats] = useState<AttemptStats>({
    completedCount: 0,
    averageScore: 0,
    passCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recommendedChapters] = useState<RecommendedChapter[]>([
    {
      id: "1",
      paperTitle: "RES5",
      chapterNumber: 15,
      chapterTitle: "Real Estate Valuation",
      weaknessScore: 45,
    },
    {
      id: "2",
      paperTitle: "RES5",
      chapterNumber: 21,
      chapterTitle: "Investment Analysis",
      weaknessScore: 52,
    },
    {
      id: "3",
      paperTitle: "RES5",
      chapterNumber: 11,
      chapterTitle: "Property Rights",
      weaknessScore: 58,
    },
  ]);

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
        const [papersRes, attemptsRes] = await Promise.all([
          fetch("/api/papers"),
          fetch("/api/student/attempts"),
        ]);

        if (papersRes.ok) {
          const data = await papersRes.json();
          setPapers(data.papers || []);
        }

        if (attemptsRes.ok) {
          const data = await attemptsRes.json();
          setStats(data.stats || {
            completedCount: 0,
            averageScore: 0,
            passCount: 0,
          });
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Welcome, {session?.user?.name || "Student"}!</h1>
          <p className="text-blue-100">Your CMFAS exam preparation dashboard</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Completed Attempts */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-300 transition duration-300 shadow-sm hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Completed Attempts</p>
                <p className="text-4xl font-bold text-gray-900">
                  {stats.completedCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500">Practice exams completed</p>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-300 transition duration-300 shadow-sm hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Average Score</p>
                <p className="text-4xl font-bold text-gray-900">
                  {stats.completedCount > 0 ? `${Math.round(stats.averageScore)}%` : "—"}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
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
            <p className="text-xs text-gray-500">
              {stats.completedCount === 0
                ? "Complete your first exam to see statistics"
                : "Across all attempts"}
            </p>
          </div>

          {/* Pass Rate */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-300 transition duration-300 shadow-sm hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Pass Rate</p>
                <p className="text-4xl font-bold text-gray-900">
                  {stats.completedCount > 0 ? `${passRate}%` : "—"}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M10 15.172l9.192-9.193a1 1 0 111.415 1.415l-10.606 10.606a1 1 0 01-1.415 0l-5.656-5.657a1 1 0 111.415-1.415l4.243 4.242z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {stats.completedCount > 0
                ? `${stats.passCount} of ${stats.completedCount} passed`
                : "No exams attempted"}
            </p>
          </div>
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
                  AI-Recommended Focus Areas
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
                        {100 - chapter.weaknessScore}% correct
                      </div>
                      <div className="w-32 h-2 bg-gray-300 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                          style={{ width: `${100 - chapter.weaknessScore}%` }}
                        />
                      </div>
                    </div>
                    <Link href={`/exam/${papers[0]?.id || ""}/practice-chapter/15`}>
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

        {/* Available Papers Section */}
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Assigned Papers</h2>
            <p className="text-gray-600">
              {papers.length === 0
                ? "No papers assigned yet"
                : `${papers.length} paper${papers.length !== 1 ? "s" : ""} available for practice`}
            </p>
          </div>

          {papers.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
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
              <p className="text-gray-600 font-medium mb-2">No papers assigned</p>
              <p className="text-gray-500 text-sm mb-6">
                Your instructor will assign papers for you to practice
              </p>
              <Link href="/practice">
                <button className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
                  Go to Practice
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {papers.map((paper) => (
                <Link key={paper.id} href={`/exam/${paper.id}`}>
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition duration-300 cursor-pointer h-full flex flex-col group">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition">
                        {paper.title}
                      </h3>
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-sm">{paper.durationMinutes} minutes</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                          <span className="text-sm">
                            {paper.totalQuestions} questions
                          </span>
                        </div>
                      </div>
                    </div>

                    <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">
                      Start Practicing
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
