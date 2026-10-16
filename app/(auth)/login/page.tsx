import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./form";
import BrandLockup from "../../../components/BrandLockup";

export default function LoginPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex flex-col">
      {/* Soft light falling on the right side, matching the landing hero */}
      <div
        className="absolute -right-40 top-0 w-[32rem] h-[32rem] rounded-full bg-blue-400/20 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <header className="relative z-10 w-full bg-blue-900/95 backdrop-blur-sm border-b border-blue-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLockup href="/" variant="light" />
          <Link href="/" className="text-sm font-medium text-blue-200 hover:text-white transition">
            Back to home
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center px-6 py-16">
        <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="text-white">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">Welcome back</h1>
            <p className="text-lg text-blue-100 leading-relaxed max-w-md mb-10">
              Sign in to continue your CMFAS exam preparation. Your papers, answers and progress are waiting for you.
            </p>
            <div className="pt-6 border-t border-blue-800">
              <p className="text-sm text-blue-200 mb-3">New to FinanceReady?</p>
              <Link href="/#signup" className="inline-block px-6 py-3 border-2 border-blue-400 text-amber-400 hover:bg-blue-400/10 rounded-lg font-semibold transition-colors duration-300">
                  Start your exam preparation
                </Link>
            </div>
          </div>

          <div className="w-full max-w-md md:justify-self-end bg-white rounded-2xl shadow-xl ring-1 ring-gray-200 p-8">
            <Suspense fallback={<p className="text-center text-sm text-gray-600">Loading...</p>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
