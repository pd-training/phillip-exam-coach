'use client';

import { useEffect, useState } from 'react';
import { useToast } from "@/components/Toast";
import AdminNav from '@/components/AdminNav';
import TeamOverview from '@/components/TeamOverview';
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
  passingScore: number;
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
  const { showToast, ToastView } = useToast();
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
      const response = await fetch('/api/admin/dashboard/paper-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'approve' }),
      });

      if (!response.ok) throw new Error('Failed to approve request');

      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: 'approved' } : r
      ));
    } catch (err) {
      showToast('Error approving request: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      const response = await fetch('/api/admin/dashboard/paper-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'reject' }),
      });

      if (!response.ok) throw new Error('Failed to reject request');

      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: 'rejected' } : r
      ));
    } catch (err) {
      showToast('Error rejecting request: ' + (err as Error).message);
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
      {ToastView}

      {/* Hero Section */}
      <div className="bg-white text-gray-900 py-8 px-0 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Track student progress and manage exam papers</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Team overview, with paper requests beside the attempts total */}
        <div className="mb-12">
          <TeamOverview
            sideCard={
              <div className="h-44">
              {/* Pending student requests */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-900">Pending student requests</h2>
                </div>

                <div className="divide-y divide-gray-200 flex-1 overflow-y-auto min-h-0">
                  {requests.length === 0 ? (
                    <div className="p-6 text-center text-gray-600">
                      No pending requests
                    </div>
                  ) : (
                    requests.slice(0, 5).map((request) => (
                      <div key={request.id} className="px-6 py-3 hover:bg-gray-50 transition">
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

                <div className="px-6 py-3 border-t border-gray-200 flex justify-between items-center">
                  <p className="text-sm text-gray-600">{requests.length} total requests</p>
                  <Link href="/admin/papers" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      View All →
                    </Link>
                </div>
              </div>
              </div>
            }
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Link href="/admin/papers">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-md transition cursor-pointer text-center group">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Manage Papers</h3>
              <p className="text-gray-600 text-sm">Edit exam papers and questions</p>
            </div>
          </Link>

          <Link href="/admin/users">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-md transition cursor-pointer text-center group">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Manage Users</h3>
              <p className="text-gray-600 text-sm">View and manage student accounts</p>
            </div>
          </Link>

          <Link href="/admin/papers">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-md transition cursor-pointer text-center group">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Paper Access</h3>
              <p className="text-gray-600 text-sm">Choose which students can use each paper</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
