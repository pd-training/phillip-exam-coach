'use client';

import { useEffect, useState } from 'react';
import AdminNav from '@/components/AdminNav';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  attemptsToday: number;
  avgScore: string;
  passRate: number;
}

interface Attempt {
  id: string;
  userId: string;
  paperId: string;
  overallScore: number;
  submittedAt: string;
  timeSpent: number;
  student_name: string;
  paper_name: string;
}

interface PaperRequest {
  id: string;
  userId: string;
  paperId: string;
  requestedAt: string;
  status: string;
  student_name: string;
  student_email: string;
  paper_name: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [requests, setRequests] = useState<PaperRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Fetching dashboard data...');

      const [statsRes, attemptsRes, requestsRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/dashboard/recent-attempts'),
        fetch('/api/admin/dashboard/paper-requests'),
      ]);

      console.log('Stats response:', statsRes.status, statsRes.statusText);
      console.log('Attempts response:', attemptsRes.status, attemptsRes.statusText);
      console.log('Requests response:', requestsRes.status, requestsRes.statusText);

      const statsText = await statsRes.text();
      const attemptsText = await attemptsRes.text();
      const requestsText = await requestsRes.text();

      console.log('Stats data:', statsText);
      console.log('Attempts data:', attemptsText);
      console.log('Requests data:', requestsText);

      if (!statsRes.ok) {
        throw new Error(`Stats API error: ${statsRes.status} ${statsText}`);
      }
      if (!attemptsRes.ok) {
        throw new Error(`Attempts API error: ${attemptsRes.status} ${attemptsText}`);
      }
      if (!requestsRes.ok) {
        throw new Error(`Requests API error: ${requestsRes.status} ${requestsText}`);
      }

      const statsData = JSON.parse(statsText);
      const attemptsData = JSON.parse(attemptsText);
      const requestsData = JSON.parse(requestsText);

      console.log('Parsed stats:', statsData);
      console.log('Parsed attempts:', attemptsData);
      console.log('Parsed requests:', requestsData);

      setStats(statsData.stats);
      setAttempts(attemptsData.attempts || []);
      setRequests(requestsData.requests || []);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load dashboard';
      setError(errorMsg);
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRequestAction = async (
    requestId: string,
    action: 'approve' | 'reject'
  ) => {
    try {
      setActionLoading(requestId);
      const res = await fetch('/api/admin/dashboard/paper-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });

      if (!res.ok) throw new Error('Failed to process request');

      // Refresh the requests list
      const requestsRes = await fetch('/api/admin/dashboard/paper-requests');
      const requestsData = await requestsRes.json();
      setRequests(requestsData.requests || []);
    } catch (err: any) {
      alert(err.message || 'Failed to process request');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <AdminNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <AdminNav />

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl font-bold text-blue-600">{stats?.totalUsers || 0}</div>
              <div className="text-sm text-gray-600 mt-2">Total users</div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl font-bold text-teal-600">{stats?.activeUsers || 0}</div>
              <div className="text-sm text-gray-600 mt-2">Active users</div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl font-bold text-orange-500">{stats?.attemptsToday || 0}</div>
              <div className="text-sm text-gray-600 mt-2">Attempts today</div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl font-bold text-purple-600">{stats?.avgScore || 0}%</div>
              <div className="text-sm text-gray-600 mt-2">Average score</div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl font-bold text-red-600">{stats?.passRate || 0}%</div>
              <div className="text-sm text-gray-600 mt-2">Pass rate</div>
            </div>
          </div>

          {/* Recent Attempts */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent attempts</h2>
            </div>

            {attempts.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No attempts yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Paper</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Result</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Time taken</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((attempt) => {
                      const isPassed = attempt.overallScore >= 50;
                      return (
                        <tr key={attempt.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <Link
                              href={`/admin/users/${attempt.userId}`}
                              className="text-blue-600 hover:underline"
                            >
                              {attempt.student_name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-blue-600">
                            {attempt.paper_name}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {attempt.overallScore}%
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                isPassed
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {isPassed ? 'Pass' : 'Fail'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatTime(attempt.timeSpent)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDate(attempt.submittedAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Paper Requests */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Paper requests {requests.length > 0 && <span className="text-sm text-orange-600">({requests.length})</span>}
              </h2>
            </div>

            {requests.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No pending requests
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Paper requested</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Requested</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <Link
                            href={`/admin/users/${req.userId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {req.student_name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {req.student_email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {req.paper_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(req.requestedAt)}
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          <button
                            onClick={() => handleRequestAction(req.id, 'approve')}
                            disabled={actionLoading === req.id}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 disabled:bg-gray-300"
                          >
                            {actionLoading === req.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleRequestAction(req.id, 'reject')}
                            disabled={actionLoading === req.id}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 disabled:bg-gray-300"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
