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

  const timeTaken = Math.round(
    (new Date(attempt.submittedat).getTime() - new Date(attempt.startedat).getTime()) / 60000
  );

  const correctCount = questions.filter(q => q.isCorrect).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-6 border-b border-blue-800">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4">
            <Link href="/dashboard">
              <button className="text-blue-100 hover:text-white font-medium text-sm">
                ← Back to Dashboard
              </button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold mb-2">Exam Review</h1>
          <p className="text-blue-100">Review your answers and learn from your performance</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Paper & Performance Info */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Paper Info */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Exam Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Paper</p>
                <p className="text-lg font-semibold text-gray-900">{attempt.paper_name}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Date Completed</p>
                <p className="text-base text-gray-700">
                  {new Date(attempt.submittedat).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Time Taken</p>
                <p className="text-base font-semibold text-gray-900">{timeTaken} minutes</p>
              </div>
            </div>
          </div>

          {/* Score Card */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Your Performance</h2>
            <div className="space-y-6">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Score</p>
                <div className="flex items-center gap-4">
                  <div className={`text-4xl font-bold ${attempt.score >= attempt.passingScore ? 'text-green-600' : 'text-red-600'}`}>
                    {attempt.score}%
                  </div>
                  <span className={`px-4 py-2 rounded-full font-semibold ${
                    attempt.passed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {attempt.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <p className="text-gray-600 text-sm font-medium mb-2">Correct Answers</p>
                <p className="text-2xl font-bold text-gray-900">{correctCount} of {attempt.totalQuestions}</p>
              </div>

              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Passing Score Required</p>
                <p className="text-lg font-semibold text-gray-900">{attempt.passingScore}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Question Review</h2>
            <p className="text-gray-600 mt-1">Detailed review of each question and your response</p>
          </div>

          <div className="divide-y divide-gray-200">
            {questions.map((question, idx) => (
              <div key={question.id} className="p-8 hover:bg-gray-50 transition">
                {/* Question Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        question.isCorrect
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {question.isCorrect ? '✓' : '✗'}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900">
                        Question {idx + 1} (Chapter {question.chapterNumber})
                      </h3>
                    </div>
                    <p className="text-base text-gray-700 mb-6">{question.questionText}</p>
                  </div>
                </div>

                {/* Options */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
                  {[
                    { key: 'A', text: question.optionA },
                    { key: 'B', text: question.optionB },
                    { key: 'C', text: question.optionC },
                    { key: 'D', text: question.optionD },
                  ].map((option) => {
                    const isStudentAnswer = question.studentAnswer === option.key;
                    const isCorrectAnswer = question.correctAnswer === option.key;

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
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                            isCorrectAnswer
                              ? 'border-green-500 bg-green-100 text-green-700'
                              : isStudentAnswer
                              ? 'border-red-500 bg-red-100 text-red-700'
                              : 'border-gray-300'
                          }`}>
                            {option.key}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700 font-medium">{option.text}</p>
                            <div className="flex gap-2 mt-2">
                              {isCorrectAnswer && <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Correct Answer</span>}
                              {isStudentAnswer && !isCorrectAnswer && <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">Your Answer</span>}
                              {isStudentAnswer && isCorrectAnswer && <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Your Answer (Correct)</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {question.explanation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="font-bold text-blue-900 mb-2">📝 Explanation</h4>
                    <p className="text-sm text-blue-800">{question.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-between">
          <Link href="/dashboard">
            <button className="px-6 py-3 border-2 border-gray-300 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition">
              Back to Dashboard
            </button>
          </Link>
          <div className="text-sm text-gray-600 pt-3">
            Attempt ID: {attempt.id}
          </div>
        </div>
      </div>
    </div>
  );
}
