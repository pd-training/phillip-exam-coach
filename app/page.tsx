"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-blue-700">📚</div>
            <span className="text-xl font-bold text-blue-700">Phillip Exam Coach</span>
          </div>
          <div className="hidden md:flex gap-6 items-center">
            <a href="#features" className="text-slate-600 hover:text-slate-900">Features</a>
            <a href="#how-it-works" className="text-slate-600 hover:text-slate-900">How It Works</a>
            <a href="#faq" className="text-slate-600 hover:text-slate-900">FAQ</a>
            <Link href="/auth/login">
              <button className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Login</button>
            </Link>
          </div>
          <Link href="#start">
            <button className="px-4 py-2 rounded-lg font-bold bg-blue-700 hover:bg-blue-800 text-white">Get Started</button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <h1 className="text-5xl font-bold text-slate-900 mb-4">
              Your Personal AI Study Coach. <span className="text-blue-700">24/7.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              Designed for every CMFAS exam candidate. Practice smarter, not harder.
            </p>
            <div className="flex gap-4">
              <Link href="#start">
                <button className="px-6 py-3 rounded-lg font-bold bg-blue-700 hover:bg-blue-800 text-white">
                  Get Your AI Coach
                </button>
              </Link>
              <Link href="/auth/login">
                <button className="px-6 py-3 rounded-lg font-bold border border-slate-300 hover:bg-slate-50">
                  Login
                </button>
              </Link>
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-xl p-6 border border-slate-200">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-slate-600">Progress</span>
                  <span className="text-sm font-bold text-emerald-600">68%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-emerald-500" />
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">Latest Score</p>
                  <p className="text-3xl font-bold text-blue-700">72%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-slate-900">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: "Select Your Exam", icon: "📋" },
              { step: 2, title: "Take Practice Exam", icon: "📝" },
              { step: 3, title: "Get AI Recommendations", icon: "🤖" },
              { step: 4, title: "Study Recommended Topics", icon: "📚" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className="w-10 h-10 bg-blue-700 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">
                  {item.step === 1 && "Choose from 6 CMFAS exam papers"}
                  {item.step === 2 && "Take full exams or quick quizzes"}
                  {item.step === 3 && "AI analyzes your weak topics"}
                  {item.step === 4 && "Focus practice on what matters"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-slate-900">
            Powerful Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Real Exam Practice",
                desc: "Hundreds of questions from official CMFAS papers",
                icon: "✅",
              },
              {
                title: "AI Coaching",
                desc: "Personalized recommendations based on your performance",
                icon: "🧠",
              },
              {
                title: "Flexible Modes",
                desc: "Full exams, quick quizzes, and chapter-focused drills",
                icon: "⚙️",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-lg shadow border border-slate-200 hover:shadow-lg transition"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400">
            © 2024 Phillip Exam Coach. Built for CMFAS exam success.
          </p>
        </div>
      </footer>
    </div>
  );
}
