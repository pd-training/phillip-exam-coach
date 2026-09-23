"use client";

import StudentNav from "@/components/StudentNav";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

interface PaperInfo {
  id: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  description?: string;
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

export default function PracticePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const params = useParams();
  const paperId = params.paperId as string;

  const [paper, setPaper] = useState<PaperInfo | null>(null);
  const [recommendedChapters, setRecommendedChapters] = useState<RecommendedChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
  }, [status, router]);

  useEffect(() => {
    if (!paperId) return;
    fetchPaper();
  }, [paperId]);

  const fetchPaper = async () => {
    try {
      // First verify student has access to this paper
      const accessRes = await fetch(`/api/student/papers`);
      if (!accessRes.ok) {
        console.error("Could not fetch student papers");
        setLoading(false);
        return;
      }

      const accessData = await accessRes.json();
      const studentPapers = accessData.papers || [];
      
      console.log("Checking access for paperId:", paperId);
      console.log("Student has papers:", studentPapers.map((p: any) => ({ id: p.id, paperId: p.paperId })));
      
      // Check if student has access to this paper (compare against paperId, not id)
      const hasAccess = studentPapers.some((p: any) => p.paperId === paperId);
      
      if (!hasAccess) {
        console.error("Student does not have access to this paper:", paperId);
        setPaper(null);
        setLoading(false);
        return;
      }

      // Now fetch full paper details
      const [paperRes, recommendationsRes] = await Promise.all([
        fetch(`/api/papers/${paperId}`),
        fetch(`/api/student/recommendations`),
      ]);

      if (paperRes.ok) {
        const data = await paperRes.json();
        setPaper(data.paper || data);
        console.log("Paper loaded:", data.paper?.title || data.title);
      } else if (paperRes.status === 403) {
        console.error("Paper is no longer available");
        setError("This paper is no longer available. It may have been disabled by an administrator.");
        setPaper(null);
      } else {
        console.error("Failed to fetch paper:", paperRes.status);
        setError("Failed to load paper. Please try again.");
        setPaper(null);
      }

      if (recommendationsRes.ok) {
        const data = await recommendationsRes.json();
        // Filter recommendations to only show those for this paper (limit to 3)
        const filtered = (data.recommendations || [])
          .filter((rec: RecommendedChapter) => rec.paperId === paperId)
          .slice(0, 3);
        setRecommendedChapters(filtered);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setPaper(null);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentNav />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentNav />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            {error ? (
              <>
                <p className="text-red-600 font-medium mb-2">{error}</p>
                <p className="text-gray-600 text-sm">Please return to your dashboard to see available papers.</p>
              </>
            ) : (
              <p className="text-gray-600">Paper not found</p>
            )}
            <Link href="/dashboard">
              <button className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-0">
        <div className="max-w-7xl mx-auto px-6">
          <button
            onClick={() => router.back()}
            className="text-blue-100 hover:text-white font-medium text-sm mb-6 transition"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold mb-2">{paper.title}</h1>
          <p className="text-blue-100">Choose your practice mode</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Practice Modes */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Select Practice Mode</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Full Exam */}
            <button
              onClick={() => router.push(`/exam/${paperId}/full-exam`)}
              className="group bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-blue-600 hover:shadow-lg transition duration-300 text-left"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition">
                  <svg className="w-7 h-7 text-blue-600 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Recommended</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Full Exam Mode</h3>
              <p className="text-gray-600 text-sm mb-6">
                Take the complete exam under timed conditions. Get your score and detailed review of all answers.
              </p>
              <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition">
                <span>Start Exam</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Quick Quiz */}
            <button
              onClick={() => router.push(`/exam/${paperId}/quick-quiz`)}
              className="group bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-green-600 hover:shadow-lg transition duration-300 text-left"
            >
              <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-green-600 transition">
                <svg className="w-7 h-7 text-green-600 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Quiz</h3>
              <p className="text-gray-600 text-sm mb-6">
                Rapid-fire questions without time limits. Perfect for quick revision and refreshing your knowledge.
              </p>
              <div className="flex items-center gap-2 text-green-600 font-semibold group-hover:gap-3 transition">
                <span>Start Quiz</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Practice by Chapter */}
            <Link href={`/exam/${paperId}/practice-chapter`}>
              <button className="group w-full bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-purple-600 hover:shadow-lg transition duration-300 text-left">
                <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-600 transition">
                  <svg className="w-7 h-7 text-purple-600 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17.001c0 5.591 3.824 10.29 9 11.622m0-13c5.5 0 10-4.745 10-10.999C22 5.254 17.493.545 12 .545m0 13v-13m0 0C6.477 6.416 2 11.033 2 16.5c0 4.978 3.645 9.131 8.39 9.88M12 .545c5.289 0 9.882 4.033 10.236 9.099" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Practice by Chapter</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Focus on specific chapters and master each topic one step at a time.
                </p>
                <div className="flex items-center gap-2 text-purple-600 font-semibold group-hover:gap-3 transition">
                  <span>View Chapters</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </Link>
          </div>
        </div>

        {/* AI Recommended Chapters */}
        {recommendedChapters.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-300 to-orange-400 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Recommended Focus Areas</h2>
            </div>
            <p className="text-gray-600 mb-6">Based on your past exam performance, focus on these chapters:</p>

            <div className="space-y-3">
              {recommendedChapters.map((chapter, idx) => (
                <Link key={chapter.id} href={`/exam/${paperId}/practice-chapter/${chapter.chapterNumber}`}>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-orange-300 hover:shadow-md transition duration-300 cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center font-bold text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{chapter.chapterTitle}</p>
                          <p className="text-xs text-gray-600">Chapter {chapter.chapterNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-bold text-red-600">
                            {Math.round(100 - chapter.weaknessScore)}% correct
                          </div>
                          <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500"
                              style={{ width: `${Math.round(100 - chapter.weaknessScore)}%` }}
                            />
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
          <h3 className="text-lg font-bold text-blue-900 mb-4">💡 Study Tips</h3>
          <ul className="space-y-3 text-blue-800 text-sm">
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">→</span>
              <span>Start with Full Exam Mode to assess your current level</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">→</span>
              <span>Use Practice by Chapter to target weak areas</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">→</span>
              <span>Review explanations carefully to understand concepts</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
