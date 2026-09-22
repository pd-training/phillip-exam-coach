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

export default function PracticePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const params = useParams();
  const paperId = params.paperId as string;

  const [paper, setPaper] = useState<PaperInfo | null>(null);
  const [loading, setLoading] = useState(true);

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
      const res = await fetch(`/api/papers/${paperId}`);
      if (res.ok) {
        const data = await res.json();
        setPaper(data.paper);
      }
    } catch (error) {
      console.error("Failed to fetch paper:", error);
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
            <p className="text-gray-600">Paper not found</p>
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
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
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Practice Modes */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Select Practice Mode</h2>

          <div className="grid md:grid-cols-2 gap-8">
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
          </div>

          {/* Practice by Chapter */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Practice by Chapter</h3>
            <p className="text-gray-600 text-sm mb-6">
              Focus on specific chapters and master each topic one step at a time.
            </p>
            <Link href={`/exam/${paperId}/practice-chapter`}>
              <button className="px-6 py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition">
                View Chapters →
              </button>
            </Link>
          </div>
        </div>

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
