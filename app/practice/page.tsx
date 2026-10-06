'use client';

import { useEffect, useState } from 'react';
import StudentNav from '@/components/StudentNav';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface StudentPaper {
  id: string;
  paperId: string;
  paper_name: string;
  status: string;
}

interface Attempt {
  id: string;
  paperid: string;
  score: number;
  result: string;
}

export default function PracticePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [papers, setPapers] = useState<StudentPaper[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [papersRes, attemptsRes] = await Promise.all([
          fetch('/api/student/papers'),
          fetch('/api/student/attempts'),
        ]);

        if (!papersRes.ok || !attemptsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const papersData = await papersRes.json();
        const attemptsData = await attemptsRes.json();
        setPapers(papersData.papers || []);
        setAttempts(attemptsData.attempts || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load papers');
        console.error('Practice error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status]);



  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12 px-0">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">Your Papers</h1>
          <p className="text-blue-100">Prepare for your CMFAS exams</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <div>
            {papers.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-600 mb-4">No papers yet</p>
                <p className="text-sm text-gray-500 mb-6">
                  Browse available papers or wait for your admin to assign them
                </p>
                <Link
                  href="/practice/browse"
                  className="inline-block px-6 py-2 bg-amber-500 text-blue-900 rounded-lg hover:bg-amber-600 font-medium"
                >
                  Browse papers
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {papers.map((paper) => {
                  const paperAttempts = attempts.filter((a) => a.paperid === paper.paperId);
                  const latestAttempt = paperAttempts.length > 0
                    ? paperAttempts.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime())[0]
                    : null;
                  const isPassed = latestAttempt?.result === 'Pass';

                  return (
                    <Link
                      key={paper.id}
                      href={`/exam/${paper.paperId}`}
                      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-amber-400 transition flex flex-col"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1">
                          {paper.paper_name}
                        </h3>
                        {latestAttempt && (
                          <div className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                            isPassed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {isPassed ? '✓ Passed' : '○ Attempted'}
                          </div>
                        )}
                        {!latestAttempt && (
                          <div className="px-2 py-1 rounded text-xs font-semibold whitespace-nowrap bg-amber-100 text-amber-700">
                            Not started
                          </div>
                        )}
                      </div>
                      {latestAttempt && (
                        <>
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">Latest: <span className="font-semibold">{latestAttempt.score}%</span></span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  isPassed ? 'bg-green-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${latestAttempt.score}%` }}
                              />
                            </div>
                          </div>
                        </>
                      )}
                      <div className="mt-auto flex items-center text-amber-600 font-medium">
                        {latestAttempt ? 'Practice again' : 'Start practicing'} →
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
