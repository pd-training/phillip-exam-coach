'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  DocumentCheckIcon,
  BoltIcon,
  CheckCircleIcon,
  UserGroupIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-50 to-slate-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-blue-900/95 backdrop-blur-sm border-b border-blue-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="text-blue-900 w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-white">Finance<span className="text-amber-400">Ready</span></span>
                <span className="text-xs text-blue-200">by Phillip Capital</span>
              </div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-blue-200 hover:text-amber-400 transition font-medium">Features</a>
            <a href="#stats" className="text-blue-200 hover:text-amber-400 transition font-medium">Why Choose Us</a>
            <Link href="/login">
              <button className="px-6 py-2 text-amber-400 hover:text-amber-300 font-medium transition">
                Sign In
              </button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Main Content - Centered */}
          <div className="flex flex-col items-center justify-center text-center">
            {/* Tagline */}
            <p className="text-amber-400 font-semibold tracking-wide mb-4 text-sm uppercase">Financial Excellence</p>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight max-w-4xl">
              Finance<span className="text-amber-400">Ready</span>
            </h1>

            {/* Subheading with accent */}
            <p className="text-2xl md:text-3xl text-blue-100 mb-8 max-w-3xl font-light">
              Where Preparation Meets <span className="text-amber-400 font-semibold">Opportunity</span>
            </p>

            {/* Description */}
            <p className="text-lg text-blue-200 mb-6 max-w-2xl leading-relaxed">
              Practice with authentic CMFAS exam papers, receive detailed feedback on every answer, and track your progress toward mastery. Designed specifically for financial advisors who demand excellence.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/signup">
                <button className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-blue-900 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg">
                  Start Practicing Free
                </button>
              </Link>
              <Link href="/login">
                <button className="px-8 py-4 border-2 border-amber-400 text-amber-400 hover:bg-amber-400/10 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95">
                  Sign In to Continue
                </button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="inline-flex items-center gap-3 bg-blue-800/50 rounded-full px-6 py-3 border border-blue-700">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-amber-500 rounded-full border-2 border-blue-900 flex items-center justify-center text-blue-900 font-bold text-xs">A</div>
                <div className="w-8 h-8 bg-amber-400 rounded-full border-2 border-blue-900 flex items-center justify-center text-blue-900 font-bold text-xs">J</div>
                <div className="w-8 h-8 bg-amber-600 rounded-full border-2 border-blue-900 flex items-center justify-center text-white font-bold text-xs">R</div>
              </div>
              <span className="text-blue-100 text-sm"><strong className="text-amber-400">800+</strong> financial advisors mastering their exams</span>
            </div>
          </div>
        </div>
      </section>

      {/* What is CMFAS Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What is the CMFAS Exam?</h2>
            <p className="text-xl text-gray-600">Everything you need to know about Capital Markets and Financial Advisory Services certification</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1: What is CMFAS */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                <AcademicCapIcon className="text-white w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">What is CMFAS?</h3>
              <p className="text-gray-700 leading-relaxed">
                CMFAS stands for <strong>Capital Markets and Financial Advisory Services</strong>. It's a comprehensive certification exam that assesses knowledge of financial products, investment strategies, regulatory compliance, and professional conduct in the financial services industry.
              </p>
            </div>

            {/* Card 2: Who Needs It */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-8 border border-emerald-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mb-6">
                <UserGroupIcon className="text-white w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Who Needs to Take It?</h3>
              <p className="text-gray-700 leading-relaxed">
                <strong>Financial Advisors</strong> and professionals working in capital markets and investment advisory services. Required for those advising clients on stocks, bonds, investment products, derivatives, and structured products in Singapore and the region.
              </p>
            </div>

            {/* Card 3: Why It Matters */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-8 border border-amber-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center mb-6">
                <CheckCircleIcon className="text-white w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Why It Matters</h3>
              <p className="text-gray-700 leading-relaxed">
                CMFAS certification demonstrates <strong>professional competency</strong> and ensures advisors meet regulatory requirements. Passing these exams enhances credibility, protects clients, and unlocks career advancement opportunities in financial services.
              </p>
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
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-lg hover:border-amber-400 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ArrowTrendingUpIcon className="text-amber-400 w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Track Your Progress</h3>
              <p className="text-gray-700 text-sm">Monitor your performance across all exams with detailed analytics and score trends.</p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200 hover:shadow-lg hover:border-amber-400 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <DocumentCheckIcon className="text-amber-400 w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Multiple Papers</h3>
              <p className="text-gray-700 text-sm">Access complete CMFAS exam papers with all questions and detailed answer explanations.</p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200 hover:shadow-lg hover:border-amber-400 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BoltIcon className="text-amber-400 w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Instant Feedback</h3>
              <p className="text-gray-700 text-sm">Get immediate feedback on every answer with AI-powered explanations and learning tips.</p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:shadow-lg hover:border-amber-400 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CheckCircleIcon className="text-amber-400 w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Practice Anytime</h3>
              <p className="text-gray-700 text-sm">Study on your schedule with full-length exams, chapter reviews, and timed practice sessions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-gradient-to-b from-white to-blue-50">
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
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-800 text-amber-400 rounded-full flex items-center justify-center mb-4 font-bold text-2xl hover:shadow-lg hover:scale-110 transition-all">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-8 -right-4 text-amber-400 text-2xl">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-16 px-6 bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-2 text-center">Trusted by Financial Professionals</h2>
          <p className="text-center text-blue-100 mb-12">Powered by Phillip Capital</p>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center hover:transform hover:scale-105 transition-transform cursor-default">
              <div className="text-5xl font-bold mb-2 text-amber-400">800+</div>
              <p className="text-blue-100 font-semibold">Financial Advisors</p>
              <p className="text-blue-200 text-sm mt-1">Currently practicing</p>
            </div>
            <div className="text-center hover:transform hover:scale-105 transition-transform cursor-default">
              <div className="text-5xl font-bold mb-2 text-amber-400">95%</div>
              <p className="text-blue-100 font-semibold">Pass Rate</p>
              <p className="text-blue-200 text-sm mt-1">After full course</p>
            </div>
            <div className="text-center hover:transform hover:scale-105 transition-transform cursor-default">
              <div className="text-5xl font-bold mb-2 text-amber-400">10K+</div>
              <p className="text-blue-100 font-semibold">Practice Questions</p>
              <p className="text-blue-200 text-sm mt-1">Across all papers</p>
            </div>
            <div className="text-center hover:transform hover:scale-105 transition-transform cursor-default">
              <div className="text-5xl font-bold mb-2 text-amber-400">24/7</div>
              <p className="text-blue-100 font-semibold">Expert Support</p>
              <p className="text-blue-200 text-sm mt-1">Answer any question</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-blue-900 to-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Pass Your CMFAS Exam?</h2>
          <p className="text-xl text-blue-100 mb-8">Start your free practice today. No credit card required.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-blue-900 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95">
                Get Started Free
              </button>
            </Link>
            <Link href="/login">
              <button className="px-8 py-4 border-2 border-amber-400 text-amber-400 hover:bg-amber-400/10 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95">
                Already a Member
              </button>
            </Link>
          </div>

          <p className="text-blue-200 text-sm mt-6">✓ Free practice with all papers &nbsp; ✓ No credit card required &nbsp; ✓ Full access to explanations</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-300 px-6 py-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="text-blue-900 w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-sm">Finance<span className="text-amber-400">Ready</span></span>
                <span className="text-xs text-gray-400">by Phillip Capital</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">Master your CMFAS exam with confidence.</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-amber-400 transition">Features</a></li>
              <li><a href="#" className="hover:text-amber-400 transition">Pricing</a></li>
              <li><a href="#" className="hover:text-amber-400 transition">About</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-amber-400 transition">Privacy</a></li>
              <li><a href="#" className="hover:text-amber-400 transition">Terms</a></li>
              <li><a href="#" className="hover:text-amber-400 transition">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Follow Us</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-amber-400 transition">Twitter</a></li>
              <li><a href="#" className="hover:text-amber-400 transition">LinkedIn</a></li>
              <li><a href="#" className="hover:text-amber-400 transition">Facebook</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-sm text-gray-400">© 2026 Finance Ready. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
