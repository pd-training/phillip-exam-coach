'use client';

import { useEffect, useState, useCallback } from 'react';
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

interface Paper {
  id: string;
  title: string;
  description: string;
  totalTime: number;
  externalLink?: string;
}

interface PaperRequest {
  id: string;
  paperId: string;
  paper_name: string;
  status: string;
  requestedAt: string;
}

export default function BrowsePapersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [papers, setPapers] = useState<StudentPaper[]>([]);
  const [allPapers, setAllPapers] = useState<Paper[]>([]);
  const [requests, setRequests] = useState<PaperRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitMessages, setSubmitMessages] = useState<{ [key: string]: string }>({});
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'owned' | 'pending'>('all');

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
        console.error('Browse papers error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status]);

  const getStatusForPaper = (paperId: string) => {
    const ownsPaper = papers.some((p) => p.paperId === paperId);
    if (ownsPaper) return 'owned';

    const hasRequest = requests.find((r) => r.paperId === paperId);
    if (hasRequest) return hasRequest.status; // 'pending', 'approved', 'rejected'

    return 'available';
  };

  const handleRequestPaper = useCallback(async (paperId: string, paperName: string) => {
    try {
      setSubmitting(paperId);

      const res = await fetch('/api/student/paper-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setSubmitMessages((prev) => ({
          ...prev,
          [paperId]: errData.error || 'Failed to submit request',
        }));
        return;
      }

      setSubmitMessages((prev) => ({
        ...prev,
        [paperId]: 'Request submitted!',
      }));

      // Refresh data after 1 second
      setTimeout(async () => {
        try {
          const [papersRes, requestsRes, allPapersRes] = await Promise.all([
            fetch('/api/student/papers'),
            fetch('/api/student/paper-requests'),
            fetch('/api/papers/available'),
          ]);

          if (papersRes.ok && requestsRes.ok && allPapersRes.ok) {
            const papersData = await papersRes.json();
            const requestsData = await requestsRes.json();
            const allPapersData = await allPapersRes.json();

            setPapers(papersData.papers || []);
            setRequests(requestsData.requests || []);
            setAllPapers(allPapersData.papers || []);
          }
        } catch (err) {
          console.error('Error refreshing data:', err);
        }
      }, 1000);
    } catch (err: any) {
      setSubmitMessages((prev) => ({
        ...prev,
        [paperId]: err.message || 'Failed to submit request',
      }));
    } finally {
      setSubmitting(null);
    }
  }, []);

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
      <StudentNav />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-0">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">Browse Papers</h1>
          <p className="text-blue-100">Request access to practice papers</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Filter Section */}
        {allPapers.length > 0 && (
          <div className="mb-8 bg-white p-6 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Filter by status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All papers ({allPapers.length})</option>
              <option value="owned">You have access ({papers.length})</option>
              <option value="available">Request available ({allPapers.filter((p) => getStatusForPaper(p.id) === 'available').length})</option>
              <option value="pending">Pending requests ({requests.filter((r) => r.status === 'pending').length})</option>
            </select>
          </div>
        )}

        {allPapers.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600">No papers available</p>
          </div>
        ) : (
          <>
            {(() => {
              const filteredPapers = allPapers.filter((paper) => {
                const status = getStatusForPaper(paper.id);
                if (filterStatus === 'all') return true;
                return status === filterStatus;
              });

              return (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    Showing {filteredPapers.length} of {allPapers.length} papers
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPapers.length === 0 ? (
                      <div className="col-span-full bg-white rounded-lg p-8 border border-gray-200 text-center">
                        <p className="text-gray-600">No papers found in this category</p>
                      </div>
                    ) : (
                      filteredPapers.map((paper) => {
                        const status = getStatusForPaper(paper.id);
                        const msg = submitMessages[paper.id];

              return (
                <div
                  key={paper.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition flex flex-col"
                >
                  <div className="flex-1 mb-4">
                    <div className="flex items-start gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1">
                        {paper.title}
                      </h3>
                      {status === 'owned' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold whitespace-nowrap">
                          ✓ Access
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {status === 'owned' && (
                      <Link
                        href={`/exam/${paper.id}`}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-center whitespace-nowrap"
                      >
                        Practice →
                      </Link>
                    )}

                    {status === 'available' && (
                      <>
                        <button
                          onClick={() =>
                            handleRequestPaper(paper.id, paper.title)
                          }
                          disabled={submitting === paper.id}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap disabled:bg-gray-300"
                        >
                          {submitting === paper.id ? 'Requesting...' : 'Request'}
                        </button>
                        {msg && (
                          <p className="text-xs text-green-600 font-medium text-center">
                            {msg}
                          </p>
                        )}
                      </>
                    )}

                    {status === 'pending' && (
                      <span className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium text-center whitespace-nowrap">
                        ⏳ Pending
                      </span>
                    )}

                    {status === 'approved' && (
                      <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium text-center whitespace-nowrap">
                        ✓ Approved
                      </span>
                    )}

                    {status === 'rejected' && (
                      <span className="px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium text-center whitespace-nowrap">
                        ✗ Rejected
                      </span>
                    )}

                    {paper.externalLink && (
                      <a
                        href={paper.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium text-center whitespace-nowrap transition"
                      >
                        Learn more →
                      </a>
                    )}
                  </div>
                      </div>
                      );
                      })
                    )}
                  </div>
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
