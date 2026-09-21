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

interface AvailablePaper {
  id: string;
  name: string;
  description: string;
}

interface PaperRequest {
  id: string;
  paperId: string;
  paper_name: string;
  status: string;
  requestedAt: string;
  respondedAt?: string;
}

export default function PracticePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [papers, setPapers] = useState<StudentPaper[]>([]);
  const [requests, setRequests] = useState<PaperRequest[]>([]);
  const [availablePapers, setAvailablePapers] = useState<AvailablePaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPapersAndRequests();
    }
  }, [status]);

  const fetchPapersAndRequests = async () => {
    try {
      setLoading(true);
      setError('');

      const [papersRes, requestsRes, allPapersRes] = await Promise.all([
        fetch('/api/student/papers'),
        fetch('/api/student/paper-requests'),
        fetch('/api/papers'),
      ]);

      if (!papersRes.ok || !requestsRes.ok || !allPapersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const papersData = await papersRes.json();
      const requestsData = await requestsRes.json();
      const allPapersData = await allPapersRes.json();

      setPapers(papersData.papers || []);
      setRequests(requestsData.requests || []);
      setAvailablePapers(allPapersData.papers || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load papers');
      console.error('Practice error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPaper = async () => {
    if (!selectedPaperId) {
      setSubmitError('Please select a paper');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');
      setSubmitSuccess('');

      const res = await fetch('/api/student/paper-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId: selectedPaperId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit request');
      }

      const data = await res.json();
      setSubmitSuccess(data.message || 'Request submitted successfully');
      setSelectedPaperId('');

      // Refresh requests
      setTimeout(() => {
        fetchPapersAndRequests();
        setShowModal(false);
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getRequestablesPapers = () => {
    const ownedPaperIds = new Set(papers.map((p) => p.paperId));
    const requestedPaperIds = new Set(requests.map((r) => r.paperId));

    return availablePapers.filter(
      (p) => !ownedPaperIds.has(p.id) && !requestedPaperIds.has(p.id)
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading your papers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Practice</h1>
              <p className="text-gray-600 mt-1">Select a paper to begin practicing</p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Available Papers */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your papers ({papers.length})
          </h2>

          {papers.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600 mb-4">No papers assigned yet</p>
              <p className="text-sm text-gray-500">
                Ask your admin to assign papers or submit a request below.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {papers.map((paper) => (
                <Link
                  key={paper.id}
                  href={`/exam/${paper.paperId}`}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {paper.paper_name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    {paper.paper_description || 'Click to start practicing'}
                  </p>
                  <div className="mt-4 flex items-center text-blue-600">
                    Start practicing →
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Paper Requests Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Paper requests {requests.length > 0 && <span className="text-sm text-orange-600">({requests.length})</span>}
            </h2>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Request paper
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <p className="text-gray-600">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => {
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {req.paper_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Requested {new Date(req.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {isPending && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Pending
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Approved
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Request Paper Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Request a paper
              </h3>
            </div>

            <div className="px-6 py-4">
              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
                  {submitSuccess}
                </div>
              )}

              <label className="block mb-4">
                <span className="block text-sm font-medium text-gray-700 mb-2">
                  Select paper
                </span>
                <select
                  value={selectedPaperId}
                  onChange={(e) => {
                    setSelectedPaperId(e.target.value);
                    setSubmitError('');
                  }}
                  disabled={submitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">-- Choose a paper --</option>
                  {getRequestablesPapers().map((paper) => (
                    <option key={paper.id} value={paper.id}>
                      {paper.name}
                    </option>
                  ))}
                </select>
              </label>

              {getRequestablesPapers().length === 0 && (
                <p className="text-sm text-gray-600 mb-4 text-center">
                  No more papers to request
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSubmitError('');
                  setSubmitSuccess('');
                  setSelectedPaperId('');
                }}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestPaper}
                disabled={submitting || !selectedPaperId}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300"
              >
                {submitting ? 'Submitting...' : 'Submit request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
