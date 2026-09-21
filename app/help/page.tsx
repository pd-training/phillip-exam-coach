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
                <strong>1. Dashboard:</strong> Your starting point. View your papers and quick stats.
              </p>
              <p>
                <strong>2. Practice:</strong> Select from your assigned papers to begin practicing.
              </p>
              <p>
                <strong>3. Browse Papers:</strong> Request additional exam papers to practice with.
              </p>
            </div>
          </section>

          {/* Practice Modes */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Practice Modes</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">📋 Full Exam</p>
                <p className="text-sm">Complete the entire exam under timed conditions. Get your score and detailed feedback after submission.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">⚡ Quick Quiz</p>
                <p className="text-sm">Answer 15 random questions. Get instant feedback after each question to learn as you go.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">📚 Practice by Chapter</p>
                <p className="text-sm">Focus on specific topics. Answer all questions in a chapter with immediate feedback.</p>
              </div>
            </div>
          </section>

          {/* Requesting Papers */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Requesting Papers</h2>
            <div className="space-y-3 text-gray-700">
              <p>Go to <strong>Browse Papers</strong> to see all available exam papers.</p>
              <p>Click <strong>Request</strong> next to any paper you want to practice with.</p>
              <p>Your admin will review and approve your request. You'll see the status update automatically.</p>
              <p className="text-sm text-gray-600">Once approved, the paper appears in your <strong>Practice</strong> tab.</p>
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
                <p className="font-semibold text-gray-900 mb-2">How is my performance tracked?</p>
                <p className="text-gray-700">Full exam attempts are recorded with your score and performance breakdown. Your admin can view this data in the admin dashboard.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">Can I retake exams?</p>
                <p className="text-gray-700">Yes! You can practice as many times as you want. Each attempt is recorded separately.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">How long do I have to complete an exam?</p>
                <p className="text-gray-700">Full exams have a timer based on the paper duration. Quick quiz and chapter modes have no time limit.</p>
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
