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
  userid: string;
  paperid: string;
  score: number;
  startedat: string;
  submittedat: string;
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

      const [statsRes, attemptsRes, requestsRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/dashboard/recent-attempts'),
        fetch('/api/admin/dashboard/paper-requests'),
      ]);

      if (!statsRes.ok || !attemptsRes.ok || !requestsRes.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const statsData = await statsRes.json();
      const attemptsData = await attemptsRes.json();
      const requestsData = await requestsRes.json();

      setStats(statsData.stats);
      setAttempts(attemptsData.attempts || []);
      setRequests(requestsData.requests || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      const response = await fetch('/api/admin/assign-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'approve' }),
      });

      if (!response.ok) throw new Error('Failed to approve request');

      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: 'approved' } : r
      ));
    } catch (err) {
      alert('Error approving request: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      const response = await fetch('/api/admin/assign-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'reject' }),
      });

      if (!response.ok) throw new Error('Failed to reject request');

      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: 'rejected' } : r
      ));
    } catch (err) {
      alert('Error rejecting request: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="inline-block mb-4">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            </div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-6 border-b border-blue-800">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-blue-100">Monitor system activity and manage exam papers</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-5 gap-6 mb-12">
          {/* Total Users */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20a9 9 0 0118 0v2h2v-2a11 11 0 10-20 0v2h2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-green-300 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Active Today</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.activeUsers || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Attempts Today */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-purple-300 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Attempts Today</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.attemptsToday || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-yellow-300 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Avg Score</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.avgScore || '0'}%</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Pass Rate */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-emerald-300 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Pass Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.passRate || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 15.172l9.192-9.193a1 1 0 111.415 1.415l-10.606 10.606a1 1 0 01-1.415 0l-5.656-5.657a1 1 0 111.415-1.415l4.243 4.242z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Attempts */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Recent Attempts</h2>
              <p className="text-gray-600 text-sm mt-1">Latest exam submissions from students</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Paper</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Time Taken</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attempts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                        No recent attempts
                      </td>
                    </tr>
                  ) : (
                    attempts.slice(0, 5).map((attempt) => {
                      const timeTaken = Math.round(
                        (new Date(attempt.submittedat).getTime() - new Date(attempt.startedat).getTime()) / 60000
                      );
                      const submittedDate = new Date(attempt.submittedat);
                      
                      return (
                        <tr key={attempt.id} className="hover:bg-gray-50 transition cursor-pointer">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{attempt.student_name}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{attempt.paper_name}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              parseInt(String(attempt.score)) >= 50
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {attempt.score}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            <div>{submittedDate.toLocaleDateString()}</div>
                            <div className="text-gray-500">{submittedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {timeTaken} min
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Link href={`/admin/attempts/${attempt.id}`}>
                              <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition">
                                View Answers
                              </button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-600">{Math.min(5, attempts.length)} of {attempts.length} attempts</p>
              <div className="flex gap-3">
                {attempts.length > 5 && (
                  <Link href="/admin/users?tab=attempts">
                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      View all {attempts.length} attempts →
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Paper Requests */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Paper Requests</h2>
              <p className="text-gray-600 text-sm mt-1">Pending student requests</p>
            </div>

            <div className="divide-y divide-gray-200">
              {requests.length === 0 ? (
                <div className="p-6 text-center text-gray-600">
                  No pending requests
                </div>
              ) : (
                requests.slice(0, 5).map((request) => (
                  <div key={request.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="mb-3">
                      <p className="font-medium text-gray-900">{request.student_name}</p>
                      <p className="text-sm text-gray-600">{request.paper_name}</p>
                    </div>
                    <div className="flex gap-2">
                      {request.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            disabled={actionLoading === request.id}
                            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            disabled={actionLoading === request.id}
                            className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <div className={`w-full py-2 rounded-lg text-center text-sm font-medium ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-600">{requests.length} total requests</p>
              <Link href="/admin/assign-papers">
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  View All →
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Link href="/admin/papers">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-md transition cursor-pointer text-center group">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition">
                <svg className="w-6 h-6 text-blue-600 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.996 10-11.253S17.5 6.253 12 6.253z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Manage Papers</h3>
              <p className="text-gray-600 text-sm">Edit exam papers and questions</p>
            </div>
          </Link>

          <Link href="/admin/users">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-md transition cursor-pointer text-center group">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-600 transition">
                <svg className="w-6 h-6 text-purple-600 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-2a6 6 0 0112 0v2zm0 0h6v-2a6 6 0 00-9-5.656v2a4 4 0 014 4v2z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Manage Users</h3>
              <p className="text-gray-600 text-sm">View and manage student accounts</p>
            </div>
          </Link>

          <Link href="/admin/assign-papers">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-md transition cursor-pointer text-center group">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 transition">
                <svg className="w-6 h-6 text-green-600 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Assign Papers</h3>
              <p className="text-gray-600 text-sm">Assign papers to students</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
