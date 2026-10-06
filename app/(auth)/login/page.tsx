import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-50 to-slate-50 flex items-center justify-center p-5">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-blue-900/95 backdrop-blur-sm border-b border-blue-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="font-bold text-xl text-white">Finance<span className="text-amber-400">Ready</span></span>
          </Link>
          <Link href="/">
            <button className="text-blue-200 hover:text-amber-400 font-medium transition">
              ← Back to Home
            </button>
          </Link>
        </div>
      </div>

      <div className="w-full max-w-5xl mt-20">
        <div className="grid md:grid-cols-2 gap-0 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          {/* Left Panel - Value Proposition */}
          <div className="hidden md:flex bg-gradient-to-br from-blue-900 to-blue-800 p-12 flex-col justify-center items-start text-white">
            <div>
              <h2 className="text-5xl font-bold mb-6 leading-tight">Master CMFAS</h2>
              <p className="text-blue-100 mb-12 text-lg leading-relaxed max-w-sm">
                Prepare with confidence using realistic exam simulations and data-driven performance insights.
              </p>

              {/* Key Benefits - Text Only */}
              <div className="space-y-6">
                <div>
                  <p className="text-amber-300 font-semibold mb-2">Comprehensive Practice</p>
                  <p className="text-blue-100 text-sm leading-relaxed">Full-length mock exams and targeted practice sets for every certification module</p>
                </div>
                <div>
                  <p className="text-amber-300 font-semibold mb-2">Progress Analytics</p>
                  <p className="text-blue-100 text-sm leading-relaxed">Detailed performance metrics and actionable insights to guide your study efforts</p>
                </div>
                <div>
                  <p className="text-amber-300 font-semibold mb-2">Expert Support</p>
                  <p className="text-blue-100 text-sm leading-relaxed">Curated study materials and explanations from financial services subject matter experts</p>
                </div>
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
