'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (session?.user) {
      const userRole = (session.user as any)?.role;
      if (userRole === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [session, router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">📊</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Finance Ready</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition font-medium">Features</a>
            <a href="#stats" className="text-gray-600 hover:text-blue-600 transition font-medium">Why Choose Us</a>
            <Link href="/login">
              <button className="px-6 py-2 text-blue-600 hover:text-blue-700 font-medium transition">
                Sign In
              </button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 hover:bg-blue-100 transition">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-semibold text-blue-900">Join 800+ financial advisors passing CMFAS exams</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text */}
            <div className="flex flex-col justify-center">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Master Your <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">CMFAS Exam</span> with Confidence
              </h1>

              <p className="text-xl text-gray-600 mb-2 font-semibold">Get instant feedback, track progress, ace your exams</p>
              <p className="text-gray-600 mb-8">Practice with real exam papers, get detailed explanations, and identify your weak areas with our AI-powered feedback system.</p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/signup">
                  <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 active:scale-95">
                    Start Free Practice Now
                  </button>
                </Link>
                <Link href="/papers">
                  <button className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700 transition-all duration-300 transform hover:scale-105 active:scale-95">
                    Take Your First Mock Exam
                  </button>
                </Link>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-blue-400 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-xs">A</div>
                  <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-xs">J</div>
                  <div className="w-8 h-8 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-xs">R</div>
                </div>
                <span><strong>800+</strong> advisors already practicing</span>
              </div>
            </div>

            {/* Right Side - Illustration */}
            <div className="relative h-96 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-transparent rounded-3xl"></div>
              <svg viewBox="0 0 400 300" className="w-full h-full relative z-10" xmlns="http://www.w3.org/2000/svg">
                {/* Chart Background */}
                <rect x="40" y="40" width="320" height="220" fill="#F0F9FF" stroke="#BFDBFE" strokeWidth="2" rx="8"/>

                {/* Grid Lines */}
                <line x1="40" y1="100" x2="360" y2="100" stroke="#E0E7FF" strokeWidth="1" strokeDasharray="4"/>
                <line x1="40" y1="160" x2="360" y2="160" stroke="#E0E7FF" strokeWidth="1" strokeDasharray="4"/>

                {/* Bars */}
                <rect x="70" y="180" width="35" height="80" fill="#93C5FD" rx="4"/>
                <rect x="125" y="150" width="35" height="110" fill="#60A5FA" rx="4"/>
                <rect x="180" y="120" width="35" height="140" fill="#3B82F6" rx="4"/>
                <rect x="235" y="90" width="35" height="170" fill="#1D4ED8" rx="4"/>
                <rect x="290" y="60" width="35" height="200" fill="#1E40AF" rx="4"/>

                {/* Y Axis */}
                <line x1="40" y1="40" x2="40" y2="260" stroke="#4B5563" strokeWidth="2"/>

                {/* X Axis */}
                <line x1="40" y1="260" x2="360" y2="260" stroke="#4B5563" strokeWidth="2"/>

                {/* Labels */}
                <text x="87" y="285" fontSize="12" fill="#6B7280" textAnchor="middle">Week 1</text>
                <text x="142" y="285" fontSize="12" fill="#6B7280" textAnchor="middle">Week 2</text>
                <text x="197" y="285" fontSize="12" fill="#6B7280" textAnchor="middle">Week 3</text>
                <text x="252" y="285" fontSize="12" fill="#6B7280" textAnchor="middle">Week 4</text>
                <text x="307" y="285" fontSize="12" fill="#6B7280" textAnchor="middle">Week 5</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-6 bg-white border-t border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Designed for Your Success</h2>
            <p className="text-xl text-gray-600">Everything you need to pass your CMFAS exams</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-lg hover:border-blue-400 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white text-xl">📈</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Track Your Progress</h3>
              <p className="text-gray-700 text-sm">Monitor your performance across all exams with detailed analytics and score trends.</p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200 hover:shadow-lg hover:border-emerald-400 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white text-xl">📋</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Multiple Papers</h3>
              <p className="text-gray-700 text-sm">Access complete CMFAS exam papers with all questions and detailed answer explanations.</p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200 hover:shadow-lg hover:border-amber-400 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white text-xl">⚡</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Instant Feedback</h3>
              <p className="text-gray-700 text-sm">Get immediate feedback on every answer with AI-powered explanations and learning tips.</p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:shadow-lg hover:border-purple-400 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white text-xl">🎯</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Practice Anytime</h3>
              <p className="text-gray-700 text-sm">Study on your schedule with full-length exams, chapter reviews, and timed practice sessions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">How It Works</h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Sign Up', desc: 'Create your free account in seconds' },
              { step: 2, title: 'Choose Papers', desc: 'Select which CMFAS papers to practice' },
              { step: 3, title: 'Take Exams', desc: 'Complete full-length or chapter practice' },
              { step: 4, title: 'Improve', desc: 'Review answers and track your progress' },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center mb-4 font-bold text-2xl hover:shadow-lg hover:scale-110 transition-all">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-8 -right-4 text-blue-300 text-2xl">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-16 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Trusted by Financial Professionals</h2>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center hover:transform hover:scale-105 transition-transform cursor-default">
              <div className="text-5xl font-bold mb-2">800+</div>
              <p className="text-blue-100 font-semibold">Financial Advisors</p>
              <p className="text-blue-200 text-sm mt-1">Currently practicing</p>
            </div>
            <div className="text-center hover:transform hover:scale-105 transition-transform cursor-default">
              <div className="text-5xl font-bold mb-2">95%</div>
              <p className="text-blue-100 font-semibold">Pass Rate</p>
              <p className="text-blue-200 text-sm mt-1">After full course</p>
            </div>
            <div className="text-center hover:transform hover:scale-105 transition-transform cursor-default">
              <div className="text-5xl font-bold mb-2">10K+</div>
              <p className="text-blue-100 font-semibold">Practice Questions</p>
              <p className="text-blue-200 text-sm mt-1">Across all papers</p>
            </div>
            <div className="text-center hover:transform hover:scale-105 transition-transform cursor-default">
              <div className="text-5xl font-bold mb-2">24/7</div>
              <p className="text-blue-100 font-semibold">Expert Support</p>
              <p className="text-blue-200 text-sm mt-1">Answer any question</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Pass Your CMFAS Exam?</h2>
          <p className="text-xl text-gray-600 mb-8">Start your free practice today. No credit card required.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 active:scale-95">
                Get Started Free
              </button>
            </Link>
            <Link href="/login">
              <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-white hover:border-gray-400 transition-all duration-300 transform hover:scale-105 active:scale-95">
                Already a Member
              </button>
            </Link>
          </div>

          <p className="text-gray-500 text-sm mt-6">✓ Free practice with all papers &nbsp; ✓ No signup required to start &nbsp; ✓ Full access to explanations</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 px-6 py-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">📊</span>
              </div>
              <span className="font-bold text-white">Finance Ready</span>
            </div>
            <p className="text-sm text-gray-400">Master your CMFAS exam with confidence.</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-blue-400 transition">Features</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Pricing</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">About</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400 transition">Privacy</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Terms</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Follow Us</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400 transition">Twitter</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">LinkedIn</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Facebook</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-sm text-gray-400">© 2024 Finance Ready. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
