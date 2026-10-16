'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AdminNav from '@/components/AdminNav';
import Link from 'next/link';
import { buildOptions, LETTERS, type OptionKey } from '@/lib/option-order';

interface Question {
  id: string;
  questionText: string;
  correctAnswer: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  explanation: string;
  chapterNumber: number;
  studentAnswer: string | null;
  isCorrect: boolean;
  displayOrder?: OptionKey[] | null;
}

interface AttemptDetail {
  id: string;
  userid: string;
  paperid: string;
  score: number;
  passed: boolean;
  startedat: string;
  submittedat: string;
  student_name: string;
  student_email: string;
  paper_name: string;
  totalQuestions: number;
  passingScore: number;
  timeTaken?: number;
}

export default function AttemptDetailsPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;

  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQIndex, setCurrentQIndex] = useState(0);

  useEffect(() => {
    const fetchAttemptDetails = async () => {
      try {
        console.log("Fetching attempt details for:", attemptId);
        const response = await fetch(`/api/admin/attempts/${attemptId}`);
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to load attempt details');
        }
        const data = await response.json();
        console.log("API Response data:", data);
        console.log("Attempt:", data.attempt);
        console.log("Questions:", data.questions, "count:", data.questions?.length);
        
        setAttempt(data.attempt);
        setQuestions(data.questions || []);
      } catch (err: any) {
        console.error("Error fetching attempt:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttemptDetails();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading attempt details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
            <p>{error || 'Attempt not found'}</p>
            <Link href="/admin/dashboard" className="inline-block mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
                Back to Dashboard
              </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQIndex];
  const timeTaken = attempt?.timeTaken
    ? Math.round(attempt.timeTaken / 60)  // Convert seconds to minutes
    : Math.round(
        (new Date(attempt?.submittedat || 0).getTime() - new Date(attempt?.startedat || 0).getTime()) / 60000
      );
  const correctCount = questions.filter(q => q.isCorrect).length;

  // Performance by chapter
  const chapterStats = Object.values(
    questions.reduce((acc: Record<number, { chapter: number; correct: number; total: number; percentage: number }>, q) => {
      const entry = acc[q.chapterNumber] ?? (acc[q.chapterNumber] = { chapter: q.chapterNumber, correct: 0, total: 0, percentage: 0 });
      entry.total += 1;
      if (q.isCorrect) entry.correct += 1;
      entry.percentage = Math.round((entry.correct / entry.total) * 100);
      return acc;
    }, {})
  ).sort((a, b) => a.chapter - b.chapter);

  const strongChapters = chapterStats.filter(c => c.percentage >= 80);
  const weakChapters = chapterStats.filter(c => c.percentage < 60).sort((a, b) => a.percentage - b.percentage);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8 border-b border-blue-900">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-start gap-6">
          <div>
            <Link href="/admin/attempts" className="text-blue-100 hover:text-white font-medium text-sm mb-4 block">
              ← Back to Exam Attempts
            </Link>
            <h1 className="text-3xl font-bold">{attempt.student_name}'s Exam Review</h1>
            <p className="text-blue-100 mt-1">{attempt.paper_name}</p>
          </div>
          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                attempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {attempt.passed ? 'Passed' : 'Failed'}
            </span>
            <p className="text-sm font-mono text-blue-100 mt-3">{attempt.student_email}</p>
          </div>
        </div>
      </div>

      {/* Chapter summary */}
      {chapterStats.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {strongChapters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-gray-600 font-medium">Strong:</span>
                {strongChapters.map(ch => (
                  <span key={ch.chapter} className="px-2 py-1 rounded bg-green-100 text-green-800 font-medium">
                    Ch {ch.chapter} · {ch.percentage}%
                  </span>
                ))}
              </div>
            )}
            {weakChapters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-gray-600 font-medium">Needs work:</span>
                {weakChapters.map(ch => (
                  <span key={ch.chapter} className="px-2 py-1 rounded bg-red-100 text-red-800 font-medium">
                    Ch {ch.chapter} · {ch.percentage}%
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_14rem] gap-8">
        {/* Question */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {currentQuestion ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Question {currentQIndex + 1} of {questions.length}
                </h2>
                <p className="text-sm text-gray-600">Chapter {currentQuestion.chapterNumber}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
                <p className="text-lg text-gray-900 leading-relaxed">{currentQuestion.questionText}</p>
              </div>

              <div className="space-y-3 mb-8">
                {buildOptions(currentQuestion, currentQuestion.displayOrder ?? [...LETTERS]).map((option) => {
                  const isStudentAnswer = currentQuestion.studentAnswer === option.key;
                  const isCorrectAnswer = currentQuestion.correctAnswer === option.key;

                  return (
                    <div
                      key={option.key}
                      className={`p-4 rounded-lg border-2 ${
                        isCorrectAnswer
                          ? 'border-green-500 bg-green-50'
                          : isStudentAnswer
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <p className="text-gray-800 font-medium">
                        <span className="font-bold text-gray-900 mr-2">{option.label}.</span>
                        {option.text}
                      </p>
                      {(isCorrectAnswer || isStudentAnswer) && (
                        <div className="flex gap-2 mt-2">
                          {isCorrectAnswer && (
                            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded font-medium">
                              ✓ Correct Answer
                            </span>
                          )}
                          {isStudentAnswer && (
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                              isCorrectAnswer ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                            }`}>
                              {isCorrectAnswer ? "✓" : "✗"} Student's Answer
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {currentQuestion.explanation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-bold text-blue-900 mb-2">Explanation</h3>
                  <p className="text-sm text-blue-800 leading-relaxed">{currentQuestion.explanation}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-600">No questions to display</div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="bg-white rounded-lg border border-gray-200 p-5 h-fit lg:sticky lg:top-6">
          <p className="text-xs font-semibold text-gray-600 mb-3">PERFORMANCE</p>
          <div className="space-y-2 text-sm mb-6 pb-6 border-b border-gray-200">
            <div className="flex justify-between">
              <span className="text-gray-700">Correct</span>
              <span className="font-bold text-green-600">{correctCount}/{attempt.totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Score</span>
              <span className={`font-bold ${attempt.score >= attempt.passingScore ? 'text-green-600' : 'text-red-600'}`}>{attempt.score}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Time taken</span>
              <span className="font-bold">{timeTaken} min</span>
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-600 mb-3">QUESTIONS</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQIndex(idx)}
                className={`aspect-square rounded font-semibold text-xs transition ${
                  currentQIndex === idx
                    ? 'bg-blue-900 text-white'
                    : q.isCorrect
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
                title={`Q${idx + 1}: ${q.isCorrect ? 'Correct' : 'Incorrect'}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
