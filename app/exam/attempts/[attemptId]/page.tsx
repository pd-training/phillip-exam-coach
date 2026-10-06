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
  const [activeTab, setActiveTab] = useState<'summary' | 'questions' | 'performance'>('summary');

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
  
  // Get top 3 worst-performing chapters for feedback
  const topWeakChapters = chapterStats
    .filter(c => c.percentage < 60)
    .sort((a, b) => a.percentage - b.percentage)  // Sort by percentage (worst first)
    .slice(0, 3);  // Take only top 3

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-8 px-0 border-b border-blue-800">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
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
                <p className={`text-base font-bold mt-2 border-t border-blue-500 pt-2 ${attempt.passed ? 'text-green-300' : 'text-red-300'}`}>
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

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 flex gap-8">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-4 px-1 font-semibold text-sm border-b-2 transition ${
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Summary
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-4 px-1 font-semibold text-sm border-b-2 transition ${
              activeTab === 'questions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            ❓ Question Review
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-4 px-1 font-semibold text-sm border-b-2 transition ${
              activeTab === 'performance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📈 Performance
          </button>
        </div>
      </div>

      {/* Part Scores Summary Card - If parts exist */}
      {/* Part-Wise breakdown removed - already shown in header summary */}

      {/* Content Sections - Tab-based */}
      {activeTab === 'summary' && (
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
                      Your score of <strong>{attempt.score}%</strong> shows you have a solid foundation. You performed well in some areas, but chapters <strong>{topWeakChapters.map(c => c.chapter).join(', ')}</strong> need more attention. Focus your practice on these areas and review the explanations for questions you missed to improve.
                    </p>
                  </>
                )}
                <p className="text-sm text-blue-700 font-medium mt-4">💡 Tip: Use the practice-by-chapter mode to target weak areas and reinforce your strengths.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Questions Tab */}
      {activeTab === 'questions' && (
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
        <div className="w-56 bg-gray-50 border-l border-gray-200 overflow-y-auto flex flex-col flex-shrink-0">
          {/* Question Navigator - Compact Scrollable */}
          <div className="flex-1 p-6 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-600 mb-3">QUESTIONS</p>
            <div className="grid grid-cols-6 gap-1">
              {questions.map((q, idx) => (
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

          {/* Question Details section removed - info already displayed on the left */}
        </div>
      </div>
      )}

      {/* Performance Analysis Tab */}
      {activeTab === 'performance' && (
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Performance by Chapter</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {chapterStats.map((chapter) => (
                <div key={chapter.chapter} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 text-lg">Chapter {chapter.chapter}</h3>
                    <span className={`text-2xl font-bold ${chapter.percentage >= 80 ? 'text-green-600' : chapter.percentage >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      {chapter.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div
                      className={`h-3 rounded-full transition ${
                        chapter.percentage >= 80 ? 'bg-green-500' : chapter.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${chapter.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-green-600">{chapter.correct}</span> out of <span className="font-semibold">{chapter.total}</span> questions correct
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {chapter.percentage >= 80 && '✓ Strong Performance'}
                    {chapter.percentage >= 60 && chapter.percentage < 80 && '→ Needs Improvement'}
                    {chapter.percentage < 60 && '✗ Priority for Review'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
