'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminNav from '@/components/AdminNav';
import Link from 'next/link';

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
  const router = useRouter();
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
            <Link href="/admin/dashboard">
              <button className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
                Back to Dashboard
              </button>
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

  // Calculate performance by chapter
  const chapterPerformance = questions.reduce((acc: any, q: any) => {
    if (!acc[q.chapterNumber]) {
      acc[q.chapterNumber] = { correct: 0, total: 0, percentage: 0 };
    }
    acc[q.chapterNumber].total += 1;
    if (q.isCorrect) {
      acc[q.chapterNumber].correct += 1;
    }
    acc[q.chapterNumber].percentage = Math.round(
      (acc[q.chapterNumber].correct / acc[q.chapterNumber].total) * 100
    );
    return acc;
  }, {});

  // Sort chapters by performance
  const chapterStats = Object.entries(chapterPerformance)
    .map(([chapter, stats]: [string, any]) => ({
      chapter: parseInt(chapter),
      ...stats,
    }))
    .sort((a, b) => a.chapter - b.chapter);

  const strongChapters = chapterStats.filter(c => c.percentage >= 80);
  const weakChapters = chapterStats.filter(c => c.percentage < 60);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-8 px-6 border-b border-blue-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <Link href="/admin/dashboard">
              <button className="text-blue-100 hover:text-white font-medium text-sm mb-4 block">
                ← Back to Dashboard
              </button>
            </Link>
            <h1 className="text-3xl font-bold">{attempt.student_name}'s Exam Review</h1>
            <p className="text-blue-100 mt-1">{attempt.paper_name} | Score: {attempt.score}% | {attempt.passed ? '✓ PASSED' : '✗ FAILED'}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Student Email</p>
            <p className="text-sm font-mono">{attempt.student_email}</p>
          </div>
        </div>
      </div>

      {/* Areas to Improve Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Areas to Improve</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Strengths */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-full bg-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">Chapters Performed Well</h3>
              </div>
              {strongChapters.length > 0 ? (
                <div className="space-y-3">
                  {strongChapters.map(ch => (
                    <div key={ch.chapter} className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium text-gray-900">Chapter {ch.chapter}</p>
                        <span className="text-green-700 font-bold text-lg">{ch.percentage}%</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${ch.percentage}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{ch.correct} out of {ch.total} questions correct</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No chapters with 80%+ accuracy yet.</p>
              )}
            </div>

            {/* Weaknesses */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-full bg-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">Chapters Need Improvement</h3>
              </div>
              {weakChapters.length > 0 ? (
                <div className="space-y-3">
                  {weakChapters.map(ch => (
                    <div key={ch.chapter} className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium text-gray-900">Chapter {ch.chapter}</p>
                        <span className="text-red-700 font-bold text-lg">{ch.percentage}%</span>
                      </div>
                      <div className="w-full bg-red-200 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full" 
                          style={{ width: `${ch.percentage}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{ch.correct} out of {ch.total} questions correct</p>
                      <p className="text-sm text-red-700 font-medium mt-3">⚠️ Needs more practice</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">Strong performance across all chapters!</p>
              )}
            </div>
          </div>

          {/* Overall Assessment */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-2">📊 Assessment Summary</h4>
            {weakChapters.length > 0 ? (
              <p className="text-gray-700">
                Student should focus on Chapter{weakChapters.length > 1 ? 's' : ''} <strong>{weakChapters.map(c => c.chapter).join(', ')}</strong> where performance was below 60%. Recommend targeted practice in these areas.
              </p>
            ) : (
              <p className="text-gray-700">
                Excellent performance! Student has demonstrated strong understanding across all chapters.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Left Content - Question */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          {currentQuestion ? (
            <div className="max-w-3xl">
              {/* Question Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    currentQuestion.isCorrect
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {currentQuestion.isCorrect ? '✓' : '✗'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Question {currentQIndex + 1} of {questions.length}
                    </h2>
                    <p className="text-sm text-gray-600">Chapter {currentQuestion.chapterNumber}</p>
                  </div>
                </div>
              </div>

              {/* Question Text */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
                <p className="text-lg text-gray-900 leading-relaxed">{currentQuestion.questionText}</p>
              </div>

              {/* Answer Options */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Student Response vs Correct Answer</h3>
                <div className="space-y-3">
                  {[
                    { key: 'A', text: currentQuestion.optionA },
                    { key: 'B', text: currentQuestion.optionB },
                    { key: 'C', text: currentQuestion.optionC },
                    { key: 'D', text: currentQuestion.optionD },
                  ].map((option) => {
                    const isStudentAnswer = currentQuestion.studentAnswer === option.key;
                    const isCorrectAnswer = currentQuestion.correctAnswer === option.key;

                    return (
                      <div
                        key={option.key}
                        className={`p-4 rounded-lg border-2 transition ${
                          isCorrectAnswer
                            ? 'border-green-500 bg-green-50'
                            : isStudentAnswer
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                            isCorrectAnswer
                              ? 'border-green-500 bg-green-100 text-green-700'
                              : isStudentAnswer
                              ? 'border-red-500 bg-red-100 text-red-700'
                              : 'border-gray-300 bg-gray-100 text-gray-600'
                          }`}>
                            {option.key}
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-800 font-medium">{option.text}</p>
                            <div className="flex gap-2 mt-2">
                              {isCorrectAnswer && <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded font-medium">✓ Correct Answer</span>}
                              {isStudentAnswer && !isCorrectAnswer && <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded font-medium">✗ Student's Answer</span>}
                              {isStudentAnswer && isCorrectAnswer && <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded font-medium">✓ Student's Answer</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanation */}
              {currentQuestion.explanation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-bold text-blue-900 mb-2">📝 Explanation</h3>
                  <p className="text-sm text-blue-800 leading-relaxed">{currentQuestion.explanation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-600">No questions to display</div>
          )}
        </div>

        {/* Right Sidebar - Navigation */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
          {/* Student & Performance Summary */}
          <div className="p-6 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-600 mb-3">STUDENT INFO</p>
            <div className="space-y-2 text-sm mb-4 pb-4 border-b border-gray-200">
              <p className="text-gray-700"><span className="font-semibold">Name:</span> {attempt.student_name}</p>
              <p className="text-gray-700"><span className="font-semibold">Email:</span> {attempt.student_email}</p>
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-2">PERFORMANCE</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Correct:</span>
                <span className="font-bold text-green-600">{correctCount}/{attempt.totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Score:</span>
                <span className={`font-bold ${attempt.score >= attempt.passingScore ? 'text-green-600' : 'text-red-600'}`}>{attempt.score}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Time Taken:</span>
                <span className="font-bold">{timeTaken} min</span>
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="flex-1 p-6 overflow-y-auto">
            <p className="text-sm font-semibold text-gray-600 mb-4">QUESTIONS</p>
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQIndex(idx)}
                  className={`w-full aspect-square rounded-lg font-semibold text-sm transition ${
                    currentQIndex === idx
                      ? 'bg-blue-600 text-white border-2 border-blue-700'
                      : q.isCorrect
                      ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                      : 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Question Details */}
          {currentQuestion && (
            <div className="p-6 border-t border-gray-200 text-sm">
              <p className="text-gray-600 mb-1">
                <span className="font-semibold">Chapter:</span> {currentQuestion.chapterNumber}
              </p>
              <p className={`font-semibold ${currentQuestion.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {currentQuestion.isCorrect ? '✓ Correct' : '✗ Incorrect'}
              </p>
              {currentQuestion.studentAnswer && (
                <p className="text-gray-700 mt-2">
                  <span className="font-semibold">Student's Answer:</span> {currentQuestion.studentAnswer}
                </p>
              )}
              {!currentQuestion.studentAnswer && (
                <p className="text-gray-500 mt-2">
                  <span className="font-semibold">Student's Answer:</span> Not answered
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
