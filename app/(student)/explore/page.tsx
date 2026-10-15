'use client';

import { useEffect, useState } from 'react';
import StudentNav from '@/components/StudentNav';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Paper {
  id: string;
  title: string;
  description?: string;
  externalLink?: string;
  totalTime: number;
  totalQuestions?: number;
}

interface StudentPaper {
  id: string;
  paperId: string;
  paper_name: string;
  status: string;
}

interface PaperRequest {
  id: string;
  paperId: string;
  paper_name: string;
  status: string;
  requestedAt: string;
}

type PaperStatus = 'owned' | 'pending' | 'approved' | 'rejected' | 'available';

interface PaperWithStatus extends Paper {
  status: PaperStatus;
  requestedAt?: string;
}

export default function ExplorePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [papers, setPapers] = useState<PaperWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | PaperStatus>('all');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitMessages, setSubmitMessages] = useState<{ [key: string]: string }>({});

  // Auth check
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

  // Fetch data
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchData = async () => {
      try {
        const [availableRes, ownedRes, requestsRes] = await Promise.all([
          fetch('/api/papers/available'),
          fetch('/api/student/papers'),
          fetch('/api/student/paper-requests'),
        ]);

        const availableData = await availableRes.json();
        const ownedData = await ownedRes.json();
        const requestsData = await requestsRes.json();

        const availablePapers = availableData.papers || [];
        const ownedPapers = ownedData.papers || [];
        const paperRequests = requestsData.requests || [];

        // Build a map of paper statuses
        const papersWithStatus: PaperWithStatus[] = availablePapers.map(
          (paper: Paper) => {
            const owned = ownedPapers.find(
              (p: StudentPaper) => p.paperId === paper.id
            );
            if (owned) {
              return { ...paper, status: 'owned' as PaperStatus };
            }

            const request = paperRequests.find(
              (r: PaperRequest) => r.paperId === paper.id
            );
            if (request) {
              return {
                ...paper,
                status: (request.status as PaperStatus) || 'pending',
                requestedAt: request.requestedAt,
              };
            }

            return { ...paper, status: 'available' as PaperStatus };
          }
        );

        setPapers(papersWithStatus);
      } catch (error) {
        console.error('Failed to fetch papers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status]);

  const handleRequestPaper = async (paperId: string, paperTitle: string) => {
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
        [paperId]: 'Request submitted! ✓',
      }));

      // Refresh data
      setTimeout(async () => {
        try {
          const [ownedRes, requestsRes] = await Promise.all([
            fetch('/api/student/papers'),
            fetch('/api/student/paper-requests'),
          ]);

          const ownedData = await ownedRes.json();
          const requestsData = await requestsRes.json();

          const ownedPapers = ownedData.papers || [];
          const paperRequests = requestsData.requests || [];

          setPapers((prev) =>
            prev.map((paper) => {
              const owned = ownedPapers.find(
                (p: StudentPaper) => p.paperId === paper.id
              );
              if (owned) {
                return { ...paper, status: 'owned' };
              }

              const request = paperRequests.find(
                (r: PaperRequest) => r.paperId === paper.id
              );
              if (request) {
                return {
                  ...paper,
                  status: (request.status as PaperStatus) || 'pending',
                  requestedAt: request.requestedAt,
                };
              }

              return { ...paper, status: 'available' };
            })
          );

          setSubmitMessages((prev) => {
            const newMsgs = { ...prev };
            delete newMsgs[paperId];
            return newMsgs;
          });
        } catch (err) {
          console.error('Error refreshing data:', err);
        }
      }, 1500);
    } catch (err: any) {
      setSubmitMessages((prev) => ({
        ...prev,
        [paperId]: err.message || 'Failed to submit request',
      }));
    } finally {
      setSubmitting(null);
    }
  };

  // Filter papers
  const filteredPapers = papers
    .filter((paper) => {
      const matchesSearch = paper.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        filterStatus === 'all' || paper.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by status priority: owned first, then pending, then approved, then available
      const statusPriority: Record<PaperStatus, number> = {
        owned: 0,
        pending: 1,
        approved: 2,
        available: 3,
        rejected: 4,
      };
      return statusPriority[a.status] - statusPriority[b.status];
    });

  // Group papers by status for display
  const groupedPapers = {
    owned: filteredPapers.filter((p) => p.status === 'owned'),
    pending: filteredPapers.filter((p) => p.status === 'pending'),
    approved: filteredPapers.filter((p) => p.status === 'approved'),
    available: filteredPapers.filter((p) => p.status === 'available'),
    rejected: filteredPapers.filter((p) => p.status === 'rejected'),
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentNav />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading papers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12 px-0 border-b border-blue-900">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">Explore Papers</h1>
          <p className="text-blue-100">
            Browse all available exam papers and manage your access requests
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search & Filter */}
        <div className="mb-8 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Search papers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'all'
                  ? 'bg-blue-900 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              All Papers
            </button>
            <button
              onClick={() => setFilterStatus('owned')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'owned'
                  ? 'bg-blue-900 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              My Papers ({groupedPapers.owned.length})
            </button>
            <button
              onClick={() => setFilterStatus('available')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'available'
                  ? 'bg-blue-900 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              Available ({groupedPapers.available.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'pending'
                  ? 'bg-blue-900 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              Pending ({groupedPapers.pending.length})
            </button>
          </div>
        </div>

        {/* Papers Grid */}
        {filteredPapers.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-2">No papers found</p>
            <p className="text-sm text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* My Papers Section */}
            {groupedPapers.owned.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-700"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    My Papers
                  </h2>
                  <span className="ml-auto text-sm text-gray-600 font-medium">
                    {groupedPapers.owned.length} paper
                    {groupedPapers.owned.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedPapers.owned.map((paper) => (
                    <div
                      key={paper.id}
                      className="bg-white rounded-lg p-6 border-2 border-green-200 hover:shadow-lg transition"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-bold text-gray-900 flex-1">
                          {paper.title}
                        </h3>
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                          ✓ Ready
                        </span>
                      </div>
                      {paper.description && (
                        <p className="text-sm text-gray-600 mb-4">
                          {paper.description}
                        </p>
                      )}
                      <div className="text-xs text-gray-500 mb-4 space-y-1">
                        {paper.description && (
                          <p className="font-medium text-gray-700">{paper.description}</p>
                        )}
                        {paper.totalQuestions && (
                          <p>❓ {paper.totalQuestions} questions</p>
                        )}
                      </div>
                      <Link href={`/exam/${paper.id}`}>
                        <button className="w-full px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium transition">
                          Practice →
                        </button>
                      </Link>
                      {paper.externalLink && (
                        <a
                          href={paper.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-center text-sm transition"
                        >
                          Learn more →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Requests Section */}
            {groupedPapers.pending.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-yellow-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Pending Requests
                  </h2>
                  <span className="ml-auto text-sm text-gray-600 font-medium">
                    {groupedPapers.pending.length} paper
                    {groupedPapers.pending.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedPapers.pending.map((paper) => (
                    <div
                      key={paper.id}
                      className="bg-white rounded-lg p-6 border-2 border-yellow-200 hover:shadow-lg transition opacity-75"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-bold text-gray-900 flex-1">
                          {paper.title}
                        </h3>
                        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">
                          ⏳ Pending
                        </span>
                      </div>
                      {paper.description && (
                        <p className="text-sm text-gray-600 mb-4">
                          {paper.description}
                        </p>
                      )}
                      <div className="text-xs text-gray-500 mb-4 space-y-1">
                        <p>⏱ {paper.totalTime} minutes</p>
                        {paper.totalQuestions && (
                          <p>❓ {paper.totalQuestions} questions</p>
                        )}
                        {paper.requestedAt && (
                          <p className="text-gray-400">
                            Requested:{' '}
                            {new Date(paper.requestedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-yellow-700 font-medium mb-3">
                        Awaiting admin approval...
                      </p>
                      {paper.externalLink && (
                        <a
                          href={paper.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-center text-sm transition"
                        >
                          Learn more →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approved Requests Section */}
            {groupedPapers.approved.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-700"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Approved
                  </h2>
                  <span className="ml-auto text-sm text-gray-600 font-medium">
                    {groupedPapers.approved.length} paper
                    {groupedPapers.approved.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedPapers.approved.map((paper) => (
                    <div
                      key={paper.id}
                      className="bg-white rounded-lg p-6 border-2 border-blue-200 hover:shadow-lg transition"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-bold text-gray-900 flex-1">
                          {paper.title}
                        </h3>
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                          ✓ Approved
                        </span>
                      </div>
                      {paper.description && (
                        <p className="text-sm text-gray-600 mb-4">
                          {paper.description}
                        </p>
                      )}
                      <div className="text-xs text-gray-500 mb-4 space-y-1">
                        <p>⏱ {paper.totalTime} minutes</p>
                        {paper.totalQuestions && (
                          <p>❓ {paper.totalQuestions} questions</p>
                        )}
                      </div>
                      <p className="text-sm text-blue-700 font-medium mb-3">
                        Ready to use! 🎉
                      </p>
                      <Link href={`/exam/${paper.id}`}>
                        <button className="w-full px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium transition">
                          Start Practicing →
                        </button>
                      </Link>
                      {paper.externalLink && (
                        <a
                          href={paper.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-center text-sm transition"
                        >
                          Learn more →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Papers Section */}
            {groupedPapers.available.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Request Access
                  </h2>
                  <span className="ml-auto text-sm text-gray-600 font-medium">
                    {groupedPapers.available.length} paper
                    {groupedPapers.available.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedPapers.available.map((paper) => (
                    <div
                      key={paper.id}
                      className="bg-white rounded-lg p-6 border-2 border-gray-200 hover:shadow-lg transition"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-bold text-gray-900 flex-1">
                          {paper.title}
                        </h3>
                        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded">
                          Available
                        </span>
                      </div>
                      {paper.description && (
                        <p className="text-sm text-gray-600 mb-4">
                          {paper.description}
                        </p>
                      )}
                      <div className="text-xs text-gray-500 mb-4 space-y-1">
                        <p>⏱ {paper.totalTime} minutes</p>
                        {paper.totalQuestions && (
                          <p>❓ {paper.totalQuestions} questions</p>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          handleRequestPaper(paper.id, paper.title)
                        }
                        disabled={submitting === paper.id}
                        className="w-full px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium transition disabled:bg-gray-300"
                      >
                        {submitting === paper.id
                          ? 'Requesting...'
                          : 'Request Access'}
                      </button>
                      {submitMessages[paper.id] && (
                        <p className="text-xs text-green-600 font-medium text-center mt-2">
                          {submitMessages[paper.id]}
                        </p>
                      )}
                      {paper.externalLink && (
                        <a
                          href={paper.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition text-center text-sm"
                        >
                          Learn more →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Section */}
            {groupedPapers.rejected.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-red-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Rejected
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedPapers.rejected.map((paper) => (
                    <div
                      key={paper.id}
                      className="bg-white rounded-lg p-6 border-2 border-red-200 hover:shadow-lg transition opacity-75"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-bold text-gray-900 flex-1">
                          {paper.title}
                        </h3>
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                          ✗ Rejected
                        </span>
                      </div>
                      {paper.description && (
                        <p className="text-sm text-gray-600 mb-4">
                          {paper.description}
                        </p>
                      )}
                      <p className="text-sm text-red-700 font-medium mb-3">
                        Your request was declined.
                      </p>
                      {paper.externalLink && (
                        <a
                          href={paper.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-center text-sm transition"
                        >
                          Learn more →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
