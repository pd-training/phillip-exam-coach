"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";

type Item = {
  position: number;
  questionText: string;
  options: { A: string; B: string; C: string; D: string } | null;
  answer: string;
  correctAnswer: string | null;
  isCorrect: boolean;
  explanation: string;
};

type Run = {
  id: string;
  mode: "quick" | "chapter" | "full";
  chapterNumber: number | null;
  paperTitle: string | null;
  studentName: string | null;
  studentEmail: string | null;
  totalQuestions: number;
  correctCount: number;
  percentage: number;
  createdAt: string;
};

const KEYS = ["A", "B", "C", "D"] as const;

export default function PracticeRunReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [run, setRun] = useState<Run | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetch(`/api/admin/practice-runs/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        setRun(data.run);
        setItems(data.items || []);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  const modeLabel = (r: Run) =>
    r.mode === "chapter" ? `Chapter ${r.chapterNumber}` : r.mode === "full" ? "Full practice" : "Quick quiz";

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (failed || !run) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="max-w-7xl mx-auto px-6 py-10">
          <p className="text-gray-700">This practice run could not be found.</p>
          <Link href="/admin/attempts" className="inline-block mt-4 text-sm font-medium text-blue-700 hover:text-blue-800">
            ← Back to Exam Attempts
          </Link>
        </div>
      </div>
    );
  }

  const current = items[index];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <button
          onClick={() => router.push("/admin/attempts")}
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← Back to Exam Attempts
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">
          {run.studentName || run.studentEmail || "Student"}: {run.paperTitle || "Paper"} - {modeLabel(run)} Review
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          {fmtDate(run.createdAt)} · {run.correctCount} / {run.totalQuestions} correct ({run.percentage}%)
        </p>
      </div>

      {items.length === 0 ? (
        <div className="max-w-7xl mx-auto px-6 pb-10">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-600">
            No question-by-question record is available for this run.
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 pb-10 grid grid-cols-1 lg:grid-cols-[1fr_14rem] gap-8">
          {/* Question */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 mb-5">
              <p className="text-sm text-gray-600">
                Question {index + 1} of {items.length}
              </p>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${current.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {current.isCorrect ? "✓ Correct" : "✗ Wrong"}
              </span>
            </div>

            <p className="text-base font-semibold text-gray-900 leading-relaxed mb-6">{current.questionText}</p>

            {current.options && (
              <div className="space-y-3">
                {KEYS.map((key) => {
                  const isCorrectOption = current.correctAnswer === key;
                  const isWrongPick = current.answer === key && !current.isCorrect;
                  return (
                    <div
                      key={key}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 ${
                        isCorrectOption
                          ? "border-green-500 bg-green-50"
                          : isWrongPick
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      }`}
                    >
                      <span className="font-bold text-gray-900 flex-shrink-0">{key}.</span>
                      <span className="flex-1 text-sm text-gray-800">{current.options![key]}</span>
                      {isCorrectOption && <span className="font-bold text-green-600 flex-shrink-0" aria-label="Correct answer">✓</span>}
                      {isWrongPick && <span className="font-bold text-red-600 flex-shrink-0" aria-label="Your answer, incorrect">✗</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {current.explanation && (
              <div className={`mt-6 rounded-lg border p-4 ${current.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <h3 className={`font-bold mb-2 ${current.isCorrect ? "text-green-700" : "text-red-700"}`}>
                  {current.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                </h3>
                <p className={`text-sm leading-relaxed ${current.isCorrect ? "text-green-800" : "text-red-700"}`}>{current.explanation}</p>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-40 transition"
              >
                ← Previous
              </button>
              <button
                onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
                disabled={index === items.length - 1}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-40 transition"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Navigator */}
          <aside className="bg-white rounded-xl border border-gray-200 p-4 h-fit">
            <p className="text-sm font-semibold text-gray-900 mb-3">Questions</p>
            <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
              {items.map((item, i) => (
                <button
                  key={item.position}
                  onClick={() => setIndex(i)}
                  aria-label={`Question ${i + 1}, ${item.isCorrect ? "correct" : "wrong"}`}
                  className={`h-9 rounded-md text-sm font-semibold border transition ${
                    i === index ? "ring-2 ring-blue-900 " : ""
                  }${
                    item.isCorrect
                      ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                      : "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
