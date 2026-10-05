'use client';

import StudentNav from '@/components/StudentNav';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HelpPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav />

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-0">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl font-bold">Help & Support</h1>
          <p className="text-blue-100 mt-2">Learn how to use Finance Ready</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">

        <div className="space-y-8">
          {/* Getting Started */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Getting Started</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>Dashboard:</strong> Your starting point. View your exam performance, recent attempts, and AI-recommended focus areas to help you study smarter.
              </p>
              <p>
                <strong>Your Papers:</strong> Practice papers that have been assigned to you. Select a paper and choose from three practice modes: Full Exam, Quick Quiz, or Practice by Chapter.
              </p>
              <p>
                <strong>Browse Papers:</strong> Explore all available papers. View descriptions and external resources, or request access to papers you need. Your admin will review and approve your request.
              </p>
              <p>
                <strong>Account:</strong> Manage your profile and password settings.
              </p>
            </div>
          </section>

          {/* Your Dashboard */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Dashboard</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>Average Score & Pass Rate:</strong> Quick stats showing your overall performance across all attempts.
              </p>
              <p>
                <strong>Recent Exam Attempts:</strong> View your 5 most recent full exam attempts with scores and results. Click any attempt to see a detailed review of your answers.
              </p>
              <p>
                <strong>AI-Recommended Focus Areas:</strong> Based on your exam performance, the system recommends specific chapters where you need to improve. Click "Practice" to start working on those chapters.
              </p>
              <p>
                <strong>Your Papers:</strong> Shows all papers that have been assigned to you by your admin.
              </p>
            </div>
          </section>

          {/* Your Papers */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Papers</h2>
            <div className="space-y-3 text-gray-700">
              <p>View all papers that your admin has assigned to you. These are ready to practice immediately.</p>
              <p><strong>Steps:</strong></p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click on a paper to view available practice modes</li>
                <li>Choose Full Exam, Quick Quiz, or Practice by Chapter</li>
                <li>Complete your practice and review your results</li>
                <li>Your scores are tracked for progress monitoring</li>
              </ol>
            </div>
          </section>

          {/* Browse Papers */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Browse Papers</h2>
            <div className="space-y-3 text-gray-700">
              <p>Discover all available exam papers. Each paper shows a description and relevant resources to help you decide if you need access.</p>
              <p><strong>Status Indicators:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><span className="text-green-700 font-semibold">✓ Assigned</span> - You already have access to this paper</li>
                <li><span className="text-yellow-700 font-semibold">⧗ Pending</span> - Your request is under review by admin</li>
                <li><span className="text-red-700 font-semibold">✕ Rejected</span> - Your request was not approved</li>
                <li><span className="text-blue-700 font-semibold">Request →</span> - Click to request access to this paper</li>
              </ul>
              <p className="mt-3"><strong>Requesting a Paper:</strong></p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Browse papers and click "Request" on any paper you need</li>
                <li>Your admin will review your request</li>
                <li>Once approved, the paper appears in your "Your Papers" section</li>
                <li>Check back here to see request status</li>
              </ol>
            </div>
          </section>

          {/* Practice Modes */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Practice Modes</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">📋 Full Exam</p>
                <p className="text-sm">Complete the entire exam under timed conditions. Get your score and detailed feedback after submission. This is the recommended way to assess your current level and get AI recommendations.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">⚡ Quick Quiz</p>
                <p className="text-sm">Answer 15 random questions. Get instant feedback after each question to learn as you go.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">📚 Practice by Chapter</p>
                <p className="text-sm">Focus on specific topics. Answer all questions in a chapter with immediate feedback. You'll see AI-recommended chapters highlighted based on your past performance.</p>
              </div>
            </div>
          </section>

          {/* Account Settings */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account Settings</h2>
            <div className="space-y-3 text-gray-700">
              <p>Visit your <strong>Account</strong> page to update your profile information.</p>
              <p>You can change your password anytime from there.</p>
              <p>Click <strong>Log out</strong> from the navigation menu to securely exit.</p>
            </div>
          </section>

          {/* Common Questions */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Common Questions</h2>
            <div className="space-y-6">
              <div>
                <p className="font-semibold text-gray-900 mb-2">What's the difference between "Your Papers" and "Browse Papers"?</p>
                <p className="text-gray-700"><strong>Your Papers</strong> shows papers your admin has already assigned to you—you can start practicing immediately. <strong>Browse Papers</strong> shows all available papers with descriptions. You can request access to papers you need, and your admin will review and approve.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">How do I request a new paper?</p>
                <p className="text-gray-700">Go to <strong>Browse Papers</strong>, find the paper you want, and click the "Request" button. Your admin will review your request and approve it if appropriate. Once approved, it will appear in your <strong>Your Papers</strong> section.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">What are AI-Recommended Focus Areas?</p>
                <p className="text-gray-700">After you complete full exam attempts, our AI system analyzes your performance and recommends specific chapters where you need improvement. Use these to focus your study time efficiently.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">How can I review my past exams?</p>
                <p className="text-gray-700">On your dashboard, click any of your recent exam attempts to see detailed review. You'll see which questions you got right/wrong and explanations for all answers.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">Can I retake exams?</p>
                <p className="text-gray-700">Yes! You can practice as many times as you want. Each attempt is recorded separately so you can track your progress over time.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">How long do I have to complete a full exam?</p>
                <p className="text-gray-700">Full exams have a timer based on the paper duration. Quick quiz and chapter practice modes have no time limit, so you can study at your own pace.</p>
              </div>
            </div>
          </section>

          {/* Contact Support */}
          <section className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">Need More Help?</h2>
            <p className="text-blue-800">Contact your admin or training team for additional support.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
