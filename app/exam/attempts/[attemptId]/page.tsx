'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import StudentNav from '@/components/StudentNav';
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
  partScores?: Array<{
    partName: string;
    score: number;
    passed: boolean;
    passingScore: number;
    correct: number;
    total: number;
  }> | null;
}

type ChapterPct = { chapter: number; percentage: number };

function listChapters(nums: number[], max: number): string {
  if (nums.length === 0) return "";
  const shown = nums.slice(0, max);
  const more = nums.length - shown.length;
  const label = (n: number) => `Chapter ${n}`;
  const list = shown.length === 1
    ? label(shown[0])
    : `${shown.slice(0, -1).map(label).join(", ")} and ${label(shown[shown.length - 1])}`;
  return more > 0 ? `${list} and ${more} more` : list;
}

function summarizeAttempt(
  chapters: ChapterPct[],
  previous: { score: number; chapters: ChapterPct[] } | null,
  score: number
): string[] {
  const lines: string[] = [];
  const strong = chapters.filter((c) => c.percentage >= 80).sort((a, b) => a.chapter - b.chapter);
  const weak = chapters
    .filter((c) => c.percentage < 80)
    .sort((a, b) => a.percentage - b.percentage || a.chapter - b.chapter);

  if (strong.length > 0) {
    lines.push(`You did really well in ${listChapters(strong.map((c) => c.chapter), 3)}.`);
  }

  if (weak.length === 0) {
    lines.push("You were solid across every chapter, so there is no clear weak spot this time.");
  } else {
    lines.push(`Focus on ${listChapters(weak.slice(0, 3).map((c) => c.chapter), 3)} next, as these were your weakest areas.`);
  }

  if (!previous) {
    lines.push("This is your first attempt on this paper, so it sets your starting point.");
  } else {
    if (score > previous.score) lines.push("Your overall score is higher than your last attempt.");
    else if (score === previous.score) lines.push("Your overall score is the same as your last attempt.");
    else lines.push("Your overall score is lower than your last attempt.");

    const prevMap = new Map(previous.chapters.map((c) => [c.chapter, c.percentage]));
    const changes = chapters
      .filter((c) => prevMap.has(c.chapter))
      .map((c) => ({ chapter: c.chapter, diff: c.percentage - (prevMap.get(c.chapter) as number) }))
      .sort((a, b) => a.chapter - b.chapter);
    const improved = changes.filter((c) => c.diff >= 10).map((c) => c.chapter);
    const slipped = changes.filter((c) => c.diff <= -10).map((c) => c.chapter);
    if (improved.length > 0) {
      lines.push(`${listChapters(improved, 2)} improved since your last attempt.`);
    }
    if (slipped.length > 0) {
      lines.push(`${listChapters(slipped, 2)} slipped since your last attempt.`);
    }
  }

  return lines;
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
  const [previous, setPrevious] = useState<{ score: number; chapters: ChapterPct[] } | null>(null);

  // Load the previous attempt on the same paper for comparison
  useEffect(() => {
    if (!attempt) return;
    const loadPrevious = async () => {
      try {
        const listRes = await fetch('/api/student/attempts');
        if (!listRes.ok) return;
        const listData = await listRes.json();
        const currentTime = new Date(attempt.submittedat).getTime();
        const prevMeta = (listData.attempts || [])
          .filter((a: any) =>
            a.paperid === attempt.paperid &&
            a.id !== attempt.id &&
            a.score !== null &&
            new Date(a.submittedat).getTime() < currentTime
          )
          .sort((a: any, b: any) => new Date(b.submittedat).getTime() - new Date(a.submittedat).getTime())[0];
        if (!prevMeta) return;

        const detailRes = await fetch(`/api/student/attempts/${prevMeta.id}`);
        if (!detailRes.ok) return;
        const detail = await detailRes.json();

        const totals: Record<number, { correct: number; total: number }> = {};
        for (const q of detail.questions || []) {
          const entry = totals[q.chapterNumber] ?? (totals[q.chapterNumber] = { correct: 0, total: 0 });
          entry.total += 1;
          if (q.isCorrect) entry.correct += 1;
        }
        const chapters = Object.entries(totals).map(([ch, t]) => ({
          chapter: Number(ch),
          percentage: Math.round((t.correct / t.total) * 100),
        }));
        setPrevious({ score: prevMeta.score, chapters });
      } catch (err) {
        console.error('Could not load previous attempt:', err);
      }
    };
    loadPrevious();
  }, [attempt]);

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

  // Prev/Next step through the same questions the navigator shows (respects "Incorrect only")
  const visibleIndexes = questions
    .map((q, idx) => ({ q, idx }))
    .filter(({ q }) => !showIncorrectOnly || !q.isCorrect)
    .map(({ idx }) => idx);
  const prevIndex = [...visibleIndexes].reverse().find((idx) => idx < currentQIndex);
  const nextIndex = visibleIndexes.find((idx) => idx > currentQIndex);

  // Chapter summary for this attempt: 80%+ = did well, below 80% = focus on
  const chapterSummary = Object.values(
    questions.reduce((acc: Record<number, { chapter: number; correct: number; total: number }>, q) => {
      const entry = acc[q.chapterNumber] ?? (acc[q.chapterNumber] = { chapter: q.chapterNumber, correct: 0, total: 0 });
      entry.total += 1;
      if (q.isCorrect) entry.correct += 1;
      return acc;
    }, {})
  )
    .map((c) => ({ chapter: c.chapter, percentage: Math.round((c.correct / c.total) * 100) }))
    .sort((a, b) => a.chapter - b.chapter);
  const summaryLines = chapterSummary.length > 0
    ? summarizeAttempt(chapterSummary, previous, attempt.score)
    : [];
  const timeTaken = Math.round(
    (new Date(attempt.submittedat).getTime() - new Date(attempt.startedat).getTime()) / 60000
  );
  const correctCount = questions.filter(q => q.isCorrect).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-5 px-0 border-b border-blue-900">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-start gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{attempt.paper_name} - Exam Review</h1>
            {attempt.partScores && attempt.partScores.length > 0 ? (
              <div className="mt-3 space-y-1">
                {attempt.partScores.map((part, idx) => (
                  <p key={idx} className="text-blue-100">
                    {part.partName}: {part.score}% ({part.correct}/{part.total}) <span className={part.passed ? 'text-green-300 font-bold' : 'text-red-400 font-bold'}>{part.passed ? '✓ PASSED' : '✗ FAILED'}</span>
                  </p>
                ))}
                <p className="text-base font-bold mt-2 border-t border-blue-500 pt-2">
                  Overall: <span className={attempt.passed ? 'text-green-300' : 'text-red-400'}>{attempt.passed ? '✓ PASSED' : '✗ FAILED'}</span>
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-1">
                <p className="text-blue-100">
                  Score: <span className="font-bold">{attempt.score}%</span> ({correctCount}/{attempt.totalQuestions})
                </p>
                <p className="text-base font-bold border-t border-blue-500 pt-2">
                  Overall: <span className={attempt.passed ? 'text-green-300' : 'text-red-400'}>{attempt.passed ? '✓ PASSED' : '✗ FAILED'}</span>
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

      {/* Attempt summary */}
      {summaryLines.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4 space-y-1 text-sm text-gray-700 leading-relaxed">
            {summaryLines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Main Content - Questions Review */}
      <div className="flex-1 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6 h-full flex overflow-hidden">
          {/* Left Content */}
          <div className="flex-1 overflow-y-auto py-5 pr-6">
            {currentQuestion ? (
              <div className="w-full">
                {/* Question Header with Prev / Next */}
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      currentQuestion.isCorrect
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {currentQuestion.isCorrect ? '✓' : '✗'}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Question {currentQIndex + 1} of {questions.length}
                      </h2>
                      <p className="text-xs text-gray-600">Chapter {currentQuestion.chapterNumber}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => prevIndex !== undefined && setCurrentQIndex(prevIndex)}
                      disabled={prevIndex === undefined}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => nextIndex !== undefined && setCurrentQIndex(nextIndex)}
                      disabled={nextIndex === undefined}
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="bg-gray-50 rounded-lg p-4 mb-5 border border-gray-200">
                  <p className="text-base text-gray-900 leading-relaxed">{currentQuestion.questionText}</p>
                </div>

                {/* Answer Options */}
                <div className="mb-5">
                  <div className="space-y-2">
                    {buildOptions(currentQuestion, currentQuestion.displayOrder ?? [...LETTERS]).map((option) => {
                      const isStudentAnswer = currentQuestion.studentAnswer === option.key;
                      const isCorrectAnswer = currentQuestion.correctAnswer === option.key;

                      return (
                        <div
                          key={option.key}
                          className={`p-3 rounded-lg border-2 transition ${
                            isCorrectAnswer
                              ? 'border-green-500 bg-green-50'
                              : isStudentAnswer
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div>
                            <p className="text-gray-800 font-medium">
                              <span className="font-bold text-gray-900 mr-2">{option.label}.</span>
                              {option.text}
                            </p>
                            <div className="flex gap-2 mt-2">
                              {isCorrectAnswer && <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded font-medium">✓ Correct Answer</span>}
                              {isStudentAnswer && !isCorrectAnswer && <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded font-medium">✗ Your Answer</span>}
                              {isStudentAnswer && isCorrectAnswer && <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded font-medium">✓ Your Answer</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation */}
                {currentQuestion.explanation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
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
          <div className="hidden md:flex w-56 bg-gray-50 border-l border-gray-200 overflow-y-auto flex-col flex-shrink-0">
            {/* Question Navigator - Compact Scrollable */}
            <div className="flex-1 min-h-0 p-6 flex flex-col">
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
              <div className="grid grid-cols-6 gap-1 max-h-[55vh] overflow-y-auto pr-1 content-start">
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

            <div className="p-6 border-t border-gray-200">
              {attempt.passed ? (
                <Link href="/explore">
                  <button className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition">
                    ✓ Try Another Paper
                  </button>
                </Link>
              ) : (
                <Link href={`/exam/${attempt.paperid}`}>
                  <button className="w-full px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition">
                    Practice Again
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
