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

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Help & Support</h1>

        <div className="space-y-8">
          {/* Getting Started */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Getting Started</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>1. Dashboard:</strong> Your starting point. View your assigned papers, exam performance stats, recent attempts, and AI-recommended focus areas.
              </p>
              <p>
                <strong>2. Practice:</strong> Select from your assigned papers and choose a practice mode. Get AI-recommended chapters to focus on based on your past performance.
              </p>
              <p>
                <strong>3. Account:</strong> Manage your profile and password settings.
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
                <strong>Your Papers:</strong> Shows all papers approved by your admin for you to practice with.
              </p>
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

          {/* Requesting Papers */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Getting Additional Papers</h2>
            <div className="space-y-3 text-gray-700">
              <p>If you need additional exam papers to practice with, contact your admin to request access.</p>
              <p>Your admin will review and approve your request, then you'll see the new papers in your <strong>Practice</strong> section.</p>
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
                <p className="font-semibold text-gray-900 mb-2">What are AI-Recommended Focus Areas?</p>
                <p className="text-gray-700">After you complete full exam attempts, our AI system analyzes your performance and recommends specific chapters where you scored below your average. This helps you focus your study time efficiently on areas that need improvement.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">How can I review my past exams?</p>
                <p className="text-gray-700">On your dashboard, click any of your recent exam attempts to see a detailed review. You'll see which questions you answered correctly, which ones you got wrong, and the explanations for all answers.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">How is my performance tracked?</p>
                <p className="text-gray-700">Full exam attempts are recorded with your score and performance breakdown. Your admin can view this data in the admin dashboard.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">Can I retake exams?</p>
                <p className="text-gray-700">Yes! You can practice as many times as you want. Each attempt is recorded separately so you can track your progress over time.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">How long do I have to complete an exam?</p>
                <p className="text-gray-700">Full exams have a timer based on the paper duration. Quick quiz and chapter modes have no time limit so you can study at your own pace.</p>
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
