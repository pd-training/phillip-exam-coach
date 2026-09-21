'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface StudentPaper {
  id: string;
  paperId: string;
  paper_name: string;
  paper_description: string;
  status: string;
}

interface Paper {
  id: string;
  name: string;
  description: string;
  totalQuestions: number;
  totalTime: number;
}

interface PaperRequest {
  id: string;
  paperId: string;
  paper_name: string;
  status: string;
  requestedAt: string;
}

type Tab = 'your-papers' | 'browse';

export default function PracticePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('your-papers');
  const [papers, setPapers] = useState<StudentPaper[]>([]);
  const [allPapers, setAllPapers] = useState<Paper[]>([]);
  const [requests, setRequests] = useState<PaperRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitMessages, setSubmitMessages] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [papersRes, requestsRes, allPapersRes] = await Promise.all([
        fetch('/api/student/papers'),
        fetch('/api/student/paper-requests'),
        fetch('/api/papers/available'),
      ]);

      if (!papersRes.ok || !requestsRes.ok || !allPapersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const papersData = await papersRes.json();
      const requestsData = await requestsRes.json();
      const allPapersData = await allPapersRes.json();

      setPapers(papersData.papers || []);
      setRequests(requestsData.requests || []);
      setAllPapers(allPapersData.papers || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load papers');
      console.error('Practice error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusForPaper = (paperId: string) => {
    const ownsPaper = papers.some((p) => p.paperId === paperId);
    if (ownsPaper) return 'owned';

    const hasRequest = requests.find((r) => r.paperId === paperId);
    if (hasRequest) return hasRequest.status; // 'pending', 'approved', 'rejected'

    return 'available';
  };

  const handleRequestPaper = async (paperId: string, paperName: string) => {
    try {
      setSubmitting(paperId);
      setSubmitMessages({ ...submitMessages, [paperId]: '' });

      const res = await fetch('/api/student/paper-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit request');
      }

      setSubmitMessages({
        ...submitMessages,
        [paperId]: 'Request submitted!',
      });

      // Refresh data after 1 second
      setTimeout(fetchData, 1000);
    } catch (err: any) {
      setSubmitMessages({
        ...submitMessages,
        [paperId]: err.message || 'Failed to submit request',
      });
    } finally {
      setSubmitting(null);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 60);
    const minutes = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Practice</h1>
              <p className="text-gray-600 mt-1">Prepare for your CMFAS exams</p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
            >
              ← Dashboard
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-t border-gray-200 pt-0">
            <button
              onClick={() => setTab('your-papers')}
              className={`px-1 py-4 font-medium transition border-b-2 ${
                tab === 'your-papers'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Your papers ({papers.length})
            </button>
            <button
              onClick={() => setTab('browse')}
              className={`px-1 py-4 font-medium transition border-b-2 ${
                tab === 'browse'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Browse papers ({allPapers.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Your Papers Tab */}
        {tab === 'your-papers' && (
          <div>
            {papers.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-600 mb-4">No papers yet</p>
                <p className="text-sm text-gray-500 mb-6">
                  Browse available papers or wait for your admin to assign them
                </p>
                <button
                  onClick={() => setTab('browse')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Browse papers
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {papers.map((paper) => (
                  <Link
                    key={paper.id}
                    href={`/exam/${paper.paperId}`}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      {paper.paper_name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {paper.paper_description || 'Click to start practicing'}
                    </p>
                    <div className="mt-4 flex items-center text-blue-600 font-medium">
                      Start practicing →
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Browse Papers Tab */}
        {tab === 'browse' && (
          <div>
            {allPapers.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-600">No papers available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allPapers.map((paper) => {
                  const status = getStatusForPaper(paper.id);
                  const msg = submitMessages[paper.id];

                  return (
                    <div
                      key={paper.id}
                      className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {paper.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {paper.description}
                        </p>
                        <div className="flex gap-4 mt-3 text-sm text-gray-500">
                          {paper.totalQuestions && (
                            <span>📝 {paper.totalQuestions} questions</span>
                          )}
                          {paper.totalTime && (
                            <span>⏱️ {formatTime(paper.totalTime)}</span>
                          )}
                        </div>
                      </div>

                      <div className="ml-6 flex flex-col items-end gap-2">
                        {status === 'owned' && (
                          <Link
                            href={`/exam/${paper.id}`}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium whitespace-nowrap"
                          >
                            Start →
                          </Link>
                        )}

                        {status === 'available' && (
                          <>
                            <button
                              onClick={() =>
                                handleRequestPaper(paper.id, paper.name)
                              }
                              disabled={submitting === paper.id}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap disabled:bg-gray-300"
                            >
                              {submitting === paper.id ? 'Requesting...' : 'Request'}
                            </button>
                            {msg && (
                              <p className="text-xs text-green-600 font-medium text-right">
                                {msg}
                              </p>
                            )}
                          </>
                        )}

                        {status === 'pending' && (
                          <span className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium whitespace-nowrap">
                            ⏳ Pending
                          </span>
                        )}

                        {status === 'approved' && (
                          <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium whitespace-nowrap">
                            ✓ Approved
                          </span>
                        )}

                        {status === 'rejected' && (
                          <span className="px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium whitespace-nowrap">
                            ✗ Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
