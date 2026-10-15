'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import StudentNav from '@/components/StudentNav';
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
  partScores?: Array<{
    partName: string;
    score: number;
    passed: boolean;
    passingScore: number;
    correct: number;
    total: number;
  }> | null;
}

export default function AttemptReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const attemptId = params.attemptId as string;

  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(false);

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated' || !session?.user) {
      router.push('/login');
      return;
    }

    if ((session?.user as any)?.role === 'ADMIN') {
      router.push('/admin/dashboard');
      return;
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchAttemptDetails = async () => {
      try {
        console.log("Fetching attempt details for:", attemptId);
        const response = await fetch(`/api/student/attempts/${attemptId}`);
        
        const data = await response.json();
        console.log("API Response:", response.status, data);

        if (!response.ok) {
          throw new Error(data.details || data.error || 'Failed to load attempt details');
        }
        
        setAttempt(data.attempt);
        setQuestions(data.questions);
      } catch (err: any) {
        console.error("Error fetching attempt:", err);
        setError(err.message || 'Failed to load attempt details');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && attemptId) {
      fetchAttemptDetails();
    }
  }, [attemptId, status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentNav />
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
        <StudentNav />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
            <p>{error || 'Attempt not found'}</p>
            <Link href="/dashboard">
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
  const timeTaken = Math.round(
    (new Date(attempt.submittedat).getTime() - new Date(attempt.startedat).getTime()) / 60000
  );
  const correctCount = questions.filter(q => q.isCorrect).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8 px-0 border-b border-blue-900">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-start gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4">{attempt.paper_name} - Exam Review</h1>
            {attempt.partScores && attempt.partScores.length > 0 ? (
              <div className="mt-3 space-y-1">
                {attempt.partScores.map((part, idx) => (
                  <p key={idx} className="text-blue-100">
                    {part.partName}: <span className={part.passed ? 'text-green-200 font-bold' : 'text-red-200 font-bold'}>{part.score}%</span> ({part.correct}/{part.total}) {part.passed ? '✓ PASSED' : '✗ FAILED'}
                  </p>
                ))}
                <p className={`text-base font-bold mt-2 border-t border-blue-500 pt-2 ${attempt.passed ? 'text-green-300' : 'text-red-300'}`}>
                  Overall: {attempt.passed ? '✓ PASSED' : '✗ FAILED'}
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-1">
                <p className="text-blue-100">
                  Score: <span className={attempt.passed ? 'text-green-200 font-bold' : 'text-red-200 font-bold'}>{attempt.score}%</span> ({correctCount}/{attempt.totalQuestions})
                </p>
                <p className={`text-base font-bold border-t border-blue-500 pt-2 ${attempt.passed ? 'text-green-300' : 'text-red-300'}`}>
                  Overall: {attempt.passed ? '✓ PASSED' : '✗ FAILED'}
                </p>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Time Taken</p>
            <p className="text-2xl font-bold">{timeTaken} min</p>
          </div>
        </div>
      </div>

      {/* Main Content - Questions Review */}
      <div className="flex-1 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6 h-full flex overflow-hidden">
          {/* Left Content */}
          <div className="flex-1 overflow-y-auto py-8 pr-6">
            {currentQuestion ? (
              <div className="max-w-2xl">
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
                  <h3 className="font-semibold text-gray-900 mb-4">Your Response vs Correct Answer</h3>
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
                                {isStudentAnswer && !isCorrectAnswer && <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded font-medium">✗ Your Answer</span>}
                                {isStudentAnswer && isCorrectAnswer && <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded font-medium">✓ Your Answer</span>}
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
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                    <h3 className="font-bold text-blue-900 mb-2">📝 Explanation</h3>
                    <p className="text-sm text-blue-800 leading-relaxed">{currentQuestion.explanation}</p>
                  </div>
                )}

                {/* CTAs */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    {attempt.passed ? (
                      <Link href="/explore">
                        <button className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition">
                          ✓ Try Another Paper
                        </button>
                      </Link>
                    ) : (
                      <button
                        onClick={() => setCurrentQIndex(0)}
                        className="w-full px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition"
                      >
                        🔄 Practice Again
                      </button>
                    )}
                    <Link href="/dashboard">
                      <button className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition">
                        Back to Dashboard
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-600">No questions to display</div>
            )}
          </div>

          {/* Right Sidebar - Navigation */}
          <div className="hidden md:flex w-56 bg-gray-50 border-l border-gray-200 overflow-y-auto flex-col flex-shrink-0">
            {/* Question Navigator - Compact Scrollable */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Filter Toggle */}
              <button
                onClick={() => setShowIncorrectOnly(!showIncorrectOnly)}
                className={`w-full px-3 py-2 rounded text-xs font-medium transition mb-4 ${
                  showIncorrectOnly
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300'
                }`}
              >
                {showIncorrectOnly ? '✗ Incorrect Only' : 'All Questions'}
              </button>

              <p className="text-xs font-semibold text-gray-600 mb-3">QUESTIONS</p>
              <div className="grid grid-cols-6 gap-1">
                {questions
                  .map((q, idx) => ({ q, idx }))
                  .filter(({ q }) => !showIncorrectOnly || !q.isCorrect)
                  .map(({ q, idx }) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`w-full aspect-square rounded font-semibold text-xs transition ${
                        currentQIndex === idx
                          ? 'bg-blue-600 text-white border-2 border-blue-700'
                          : q.isCorrect
                          ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                      }`}
                      title={`Q${idx + 1}: ${q.isCorrect ? 'Correct' : 'Incorrect'}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
