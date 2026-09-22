"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StudentNav from "@/components/StudentNav";
import Link from "next/link";

interface Attempt {
  id: string;
  paperid: string;
  paperTitle: string;
  score: number;
  result: string;
  timeTaken: number;
  submittedat: string;
}

export default function AllAttemptsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAttempts();
    }
  }, [status]);

  const fetchAttempts = async () => {
    try {
      const res = await fetch("/api/student/attempts");
      if (res.ok) {
        const data = await res.json();
        setAttempts(data.attempts || []);
      }
    } catch (error) {
      console.error("Failed to fetch attempts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-gray-600">Loading attempts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <StudentNav />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/dashboard">
            <button className="mb-4 text-blue-100 hover:text-white font-medium text-sm flex items-center gap-2">
              ← Back to Dashboard
            </button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">All Exam Attempts</h1>
          <p className="text-blue-100">{attempts.length} attempts total</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
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
            <p className="text-gray-600 font-medium mb-2">No exam attempts yet</p>
            <p className="text-gray-500 text-sm mb-6">
              Start practicing to see your attempts here
            </p>
            <Link href="/practice">
              <button className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
                Go to Practice
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map((attempt) => (
              <Link key={attempt.id} href={`/exam/attempts/${attempt.id}`}>
                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition duration-300 cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition mb-1">
                        {attempt.paperTitle}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>
                          {new Date(attempt.submittedat).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                        <span>{attempt.timeTaken} min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div
                          className={`font-bold ${
                            attempt.result === "Pass"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {attempt.score}%
                        </div>
                        <div
                          className={`text-xs font-medium ${
                            attempt.result === "Pass"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
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
        )}
      </div>
    </div>
  );
}
