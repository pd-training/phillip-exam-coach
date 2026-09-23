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

  // Sort chapters by performance to highlight strengths and weaknesses
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
      <StudentNav />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-8 px-6 border-b border-blue-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <Link href="/dashboard">
              <button className="text-blue-100 hover:text-white font-medium text-sm mb-4 block">
                ← Back to Dashboard
              </button>
            </Link>
            <h1 className="text-3xl font-bold">{attempt.paper_name} - Exam Review</h1>
            {attempt.partScores && attempt.partScores.length > 0 ? (
              // Show part-wise results if parts exist
              <div className="mt-3 space-y-1">
                {attempt.partScores.map((part, idx) => (
                  <p key={idx} className="text-blue-100">
                    {part.partName}: <span className={part.passed ? 'text-green-200 font-bold' : 'text-red-200 font-bold'}>{part.score}%</span> ({part.correct}/{part.total}) {part.passed ? '✓ PASSED' : '✗ FAILED'}
                  </p>
                ))}
                <p className="text-blue-200 font-semibold mt-2 border-t border-blue-500 pt-2">
                  Overall: {attempt.passed ? '✓ PASSED' : '✗ FAILED'}
                </p>
              </div>
            ) : (
              // Show overall result if no parts
              <p className="text-blue-100 mt-1">Score: {attempt.score}% | {attempt.passed ? '✓ PASSED' : '✗ FAILED'}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Time Taken</p>
            <p className="text-2xl font-bold">{timeTaken} min</p>
          </div>
        </div>
      </div>

      {/* Part Scores Summary Card - If parts exist */}
      {attempt.partScores && attempt.partScores.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📊 Part-Wise Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {attempt.partScores.map((part, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    part.passed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-semibold ${part.passed ? 'text-green-900' : 'text-red-900'}`}>
                      {part.partName}
                    </h3>
                    <span className={`text-2xl font-bold ${part.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {part.score}%
                    </span>
                  </div>
                  <div className={`text-sm ${part.passed ? 'text-green-800' : 'text-red-800'}`}>
                    <div>{part.correct} out of {part.total} correct</div>
                    <div>Passing Score: {part.passingScore}%</div>
                  </div>
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${part.passed ? 'bg-green-600' : 'bg-red-600'}`}
                      style={{ width: `${Math.min(part.score, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary & Feedback Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Attempt Summary</h2>
          
          <div className="max-w-3xl">
            {/* Performance Summary */}
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
              {weakChapters.length === 0 ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">🎉 Excellent Work!</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You've demonstrated strong understanding across all chapters. Your score of <strong>{attempt.score}%</strong> shows solid mastery of the material. Keep up the excellent effort and continue practicing to maintain your high performance.
                  </p>
                </>
              ) : strongChapters.length === 0 ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">📚 Keep Practicing</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Your score of <strong>{attempt.score}%</strong> shows there's room for improvement. All chapters need more focus right now. Don't get discouraged—consistent practice and review of the explanations will help you improve. Start with the practice-by-chapter mode to strengthen your understanding.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">💪 Good Effort, More to Go</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Your score of <strong>{attempt.score}%</strong> shows you have a solid foundation. You performed well in some areas, but chapters <strong>{weakChapters.map(c => c.chapter).join(', ')}</strong> need more attention. Focus your practice on these areas and review the explanations for questions you missed to improve.
                  </p>
                </>
              )}
              <p className="text-sm text-blue-700 font-medium mt-4">💡 Tip: Use the practice-by-chapter mode to target weak areas and reinforce your strengths.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6 h-full flex overflow-hidden">
          {/* Left Content - Question */}
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
        <div className="w-72 bg-gray-50 border-l border-gray-200 overflow-y-auto flex flex-col flex-shrink-0">
          {/* Performance Summary */}
          <div className="p-6 border-b border-gray-200">
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
                <span className="text-gray-700">Passing:</span>
                <span className="font-bold">{attempt.passingScore}%</span>
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
                  <span className="font-semibold">Your Answer:</span> {currentQuestion.studentAnswer}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
