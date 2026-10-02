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

export default function PracticePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [papers, setPapers] = useState<StudentPaper[]>([]);
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

        const papersRes = await fetch('/api/student/papers');

        if (!papersRes.ok) {
          throw new Error('Failed to fetch papers');
        }

        const papersData = await papersRes.json();
        setPapers(papersData.papers || []);
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
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Browse papers
                </Link>
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
                      Ready to practice
                    </p>
                    <div className="mt-4 flex items-center text-blue-600 font-medium">
                      Start practicing →
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
