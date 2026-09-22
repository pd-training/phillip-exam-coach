"use client";

import Link from "next/link";

// SVG Illustration Components
const HeroIllustration = () => (
  <svg viewBox="0 0 400 300" className="w-full h-auto">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1e40af" />
      </linearGradient>
    </defs>
    {/* Background circles */}
    <circle cx="320" cy="50" r="80" fill="#dbeafe" opacity="0.5" />
    <circle cx="80" cy="250" r="60" fill="#dbeafe" opacity="0.5" />
    
    {/* Study chart */}
    <rect x="50" y="120" width="40" height="100" fill="url(#grad1)" rx="4" />
    <rect x="110" y="90" width="40" height="130" fill="url(#grad1)" rx="4" />
    <rect x="170" y="60" width="40" height="160" fill="url(#grad1)" rx="4" />
    <rect x="230" y="30" width="40" height="190" fill="url(#grad1)" rx="4" />
    
    {/* Chart base line */}
    <line x1="40" y1="230" x2="280" y2="230" stroke="#e5e7eb" strokeWidth="2" />
    
    {/* Success checkmarks */}
    <circle cx="70" cy="30" r="15" fill="#10b981" opacity="0.2" />
    <path d="M 65 30 L 70 35 L 78 27" stroke="#10b981" strokeWidth="2" fill="none" />
    
    <circle cx="300" cy="220" r="15" fill="#10b981" opacity="0.2" />
    <path d="M 295 220 L 300 225 L 308 217" stroke="#10b981" strokeWidth="2" fill="none" />
  </svg>
);

const ExamIcon = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12">
    <rect x="12" y="16" width="40" height="36" rx="2" fill="none" stroke="#3b82f6" strokeWidth="2" />
    <line x1="12" y1="28" x2="52" y2="28" stroke="#3b82f6" strokeWidth="2" />
    <circle cx="20" cy="40" r="2" fill="#3b82f6" />
    <circle cx="28" cy="40" r="2" fill="#3b82f6" />
    <circle cx="36" cy="40" r="2" fill="#3b82f6" />
    <circle cx="20" cy="50" r="2" fill="#3b82f6" />
    <circle cx="28" cy="50" r="2" fill="#3b82f6" />
  </svg>
);

const PracticeIcon = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12">
    <path d="M 20 16 L 16 20 L 20 24 L 24 20 Z" fill="none" stroke="#3b82f6" strokeWidth="2" />
    <path d="M 44 16 L 40 20 L 44 24 L 48 20 Z" fill="none" stroke="#3b82f6" strokeWidth="2" />
    <line x1="24" y1="20" x2="40" y2="20" stroke="#3b82f6" strokeWidth="2" />
    <rect x="16" y="32" width="32" height="24" rx="2" fill="none" stroke="#3b82f6" strokeWidth="2" />
    <line x1="24" y1="40" x2="40" y2="40" stroke="#3b82f6" strokeWidth="2" />
    <line x1="24" y1="48" x2="40" y2="48" stroke="#3b82f6" strokeWidth="2" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12">
    <polyline points="16,44 24,32 32,40 48,16" fill="none" stroke="#3b82f6" strokeWidth="2" />
    <circle cx="16" cy="44" r="2" fill="#3b82f6" />
    <circle cx="24" cy="32" r="2" fill="#3b82f6" />
    <circle cx="32" cy="40" r="2" fill="#3b82f6" />
    <circle cx="48" cy="16" r="2" fill="#3b82f6" />
    <line x1="12" y1="48" x2="52" y2="48" stroke="#3b82f6" strokeWidth="2" />
    <line x1="12" y1="48" x2="12" y2="12" stroke="#3b82f6" strokeWidth="2" />
  </svg>
);

const Step1Illustration = () => (
  <svg viewBox="0 0 200 200" className="w-full h-auto">
    <rect x="40" y="40" width="120" height="100" rx="8" fill="none" stroke="#3b82f6" strokeWidth="2" />
    <rect x="50" y="50" width="30" height="30" fill="#dbeafe" rx="2" />
    <rect x="90" y="50" width="30" height="30" fill="#dbeafe" rx="2" />
    <rect x="130" y="50" width="20" height="30" fill="#dbeafe" rx="2" />
    <line x1="50" y1="90" x2="150" y2="90" stroke="#e5e7eb" strokeWidth="1" />
    <text x="100" y="120" textAnchor="middle" fontSize="14" fill="#666" fontFamily="sans-serif">
      Select Exam
    </text>
  </svg>
);

const Step2Illustration = () => (
  <svg viewBox="0 0 200 200" className="w-full h-auto">
    <circle cx="100" cy="80" r="35" fill="none" stroke="#3b82f6" strokeWidth="2" />
    <circle cx="75" cy="70" r="6" fill="#10b981" />
    <circle cx="125" cy="70" r="6" fill="#10b981" />
    <path d="M 85 95 Q 100 105 115 95" stroke="#3b82f6" strokeWidth="2" fill="none" />
    <text x="100" y="145" textAnchor="middle" fontSize="14" fill="#666" fontFamily="sans-serif">
      Practice
    </text>
  </svg>
);

const Step3Illustration = () => (
  <svg viewBox="0 0 200 200" className="w-full h-auto">
    <circle cx="100" cy="70" r="20" fill="#3b82f6" opacity="0.2" />
    <path d="M 100 55 L 115 70 L 100 85 L 85 70 Z" fill="#3b82f6" />
    <line x1="100" y1="85" x2="100" y2="120" stroke="#3b82f6" strokeWidth="2" />
    <circle cx="80" cy="130" r="8" fill="#dbeafe" />
    <circle cx="100" cy="130" r="8" fill="#dbeafe" />
    <circle cx="120" cy="130" r="8" fill="#dbeafe" />
    <text x="100" y="160" textAnchor="middle" fontSize="14" fill="#666" fontFamily="sans-serif">
      AI Insights
    </text>
  </svg>
);

const Step4Illustration = () => (
  <svg viewBox="0 0 200 200" className="w-full h-auto">
    <path d="M 50 60 L 150 60 L 130 100 L 70 100 Z" fill="none" stroke="#3b82f6" strokeWidth="2" rx="2" />
    <rect x="65" y="110" width="70" height="50" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
    <line x1="75" y1="125" x2="145" y2="125" stroke="#3b82f6" strokeWidth="1" />
    <line x1="75" y1="135" x2="145" y2="135" stroke="#3b82f6" strokeWidth="1" />
    <line x1="75" y1="145" x2="125" y2="145" stroke="#3b82f6" strokeWidth="1" />
    <text x="100" y="175" textAnchor="middle" fontSize="14" fill="#666" fontFamily="sans-serif">
      Study Smart
    </text>
  </svg>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white backdrop-blur-sm border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">Phillip Exam Coach</span>
          </div>
          <div className="hidden md:flex gap-8 items-center">
            <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium transition">How It Works</a>
            <Link href="/login">
              <button className="px-5 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition">
                Login
              </button>
            </Link>
          </div>
          <Link href="/signup">
            <button className="px-6 py-2 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition duration-200">
              Get Started
            </button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-32">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 z-10">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Master Your CMFAS Exam with Confidence
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">
              Practice with real questions, get personalized AI coaching, and track your progress with detailed analytics.
            </p>
            <div className="flex gap-4 flex-col sm:flex-row">
              <Link href="/signup">
                <button className="px-8 py-4 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white text-lg transition duration-200 shadow-lg hover:shadow-xl">
                  Start Learning Now
                </button>
              </Link>
              <Link href="/login">
                <button className="px-8 py-4 rounded-lg font-semibold border-2 border-gray-300 text-gray-900 hover:bg-gray-50 text-lg transition duration-200">
                  Sign In
                </button>
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4 font-medium">TRUSTED BY EXAM CANDIDATES</p>
              <div className="flex gap-6 items-center text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  1000+ Questions
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  AI-Powered Coaching
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Detailed Analytics
                </div>
              </div>
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="flex-1 z-10">
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 shadow-xl border border-gray-200">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Your Journey to Success
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A simple, effective 4-step process designed to help you excel
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: "Select Your Exam", desc: "Choose from 6 official CMFAS papers", illustration: Step1Illustration },
              { step: 2, title: "Take Practice Tests", desc: "Full exams, quick quizzes, or chapter drills", illustration: Step2Illustration },
              { step: 3, title: "Get AI Insights", desc: "Personalized recommendations for weak areas", illustration: Step3Illustration },
              { step: 4, title: "Master Topics", desc: "Focused study with guided resources", illustration: Step4Illustration },
            ].map((item, idx) => {
              const Illustration = item.illustration;
              return (
                <div key={item.step} className="flex flex-col">
                  <div className="relative mb-6">
                    {idx < 3 && (
                      <div className="hidden md:block absolute top-16 left-full w-8 h-0.5 bg-gradient-to-r from-blue-300 to-transparent" />
                    )}
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                      {item.step}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-gray-200 flex flex-col flex-grow">
                    <div className="h-24 mb-4 flex items-center justify-center">
                      <Illustration />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2 text-center">{item.title}</h3>
                    <p className="text-gray-600 text-sm text-center">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features for Success
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to ace your exam
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Real Exam Practice",
                desc: "Practice with actual questions from official CMFAS papers. Experience the real exam format and timing.",
                icon: ExamIcon,
              },
              {
                title: "Flexible Learning Modes",
                desc: "Choose between full exams, quick quizzes, or focused chapter practice. Learn at your own pace.",
                icon: PracticeIcon,
              },
              {
                title: "Detailed Analytics",
                desc: "Track your progress with comprehensive statistics. Identify strengths and weaknesses instantly.",
                icon: AnalyticsIcon,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition duration-300 group"
                >
                  <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 transition duration-300">
                    <Icon />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { number: "1000+", label: "Practice Questions" },
              { number: "6", label: "Official Exam Papers" },
              { number: "24/7", label: "AI Coaching Support" },
            ].map((item, idx) => (
              <div key={idx} className="text-white">
                <div className="text-4xl md:text-5xl font-bold mb-2">{item.number}</div>
                <p className="text-blue-100 text-lg">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to ace your CMFAS exam?
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Join hundreds of exam candidates who have successfully passed their CMFAS exams using Phillip Exam Coach.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="px-8 py-4 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white text-lg transition duration-200 shadow-lg hover:shadow-xl">
                Start Your Journey
              </button>
            </Link>
            <Link href="/login">
              <button className="px-8 py-4 rounded-lg font-semibold border-2 border-gray-300 text-gray-900 hover:bg-white text-lg transition duration-200">
                Already have an account?
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="font-semibold text-white">Phillip</span>
              </div>
              <p className="text-sm">Master your CMFAS exams with confidence.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">How it works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-sm">
              © 2024 Phillip Exam Coach. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
