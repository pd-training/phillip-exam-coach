import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-5">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">📊</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Finance Ready</span>
          </Link>
          <Link href="/">
            <button className="text-gray-600 hover:text-gray-900 font-medium transition">
              ← Back to Home
            </button>
          </Link>
        </div>
      </div>

      <div className="w-full max-w-5xl mt-20">
        <div className="grid md:grid-cols-2 gap-0 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          {/* Left Panel - Illustration */}
          <div className="hidden md:flex bg-gradient-to-br from-blue-600 to-blue-700 p-12 flex-col justify-center items-center text-white">
            <div className="text-center">
              <div className="text-8xl mb-6 leading-none">🎓</div>
              <h2 className="text-4xl font-bold mb-4">Master Your CMFAS</h2>
              <p className="text-blue-100 mb-8 text-lg">AI-powered exam prep tool</p>

              {/* Feature List */}
              <div className="space-y-4 text-left inline-block">
                {[
                  { icon: "🤖", text: "Intelligent AI Coaching" },
                  { icon: "📊", text: "Real-time Progress Tracking" },
                  { icon: "✨", text: "Personalized Study Plans" },
                  { icon: "⚡", text: "Instant Practice Questions" },
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-blue-50">
                    <span className="text-2xl">{feature.icon}</span>
                    <span className="text-base">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <Suspense fallback={
              <div className="text-center text-gray-600">Loading...</div>
            }>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
