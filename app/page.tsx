'use client';

import Link from 'next/link';
import BrandLockup from '../components/BrandLockup';
import SignupForm from '../components/SignupForm';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowTrendingUpIcon,
  DocumentCheckIcon,
  BoltIcon,
  CheckCircleIcon,
  UserGroupIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

export default function LandingPage() {
  const router = useRouter();
  const [landingPapers, setLandingPapers] = useState<{ id: string; title: string; shortName?: string | null; partLabel?: string | null; description?: string | null; externalLink?: string | null }[]>([]);

  const [pickedPaperId, setPickedPaperId] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('paper');
    if (fromUrl) setPickedPaperId(fromUrl);
  }, []);

  useEffect(() => {
    fetch('/api/papers/available')
      .then((res) => (res.ok ? res.json() : { papers: [] }))
      .then((data) => setLandingPapers(data.papers || []))
      .catch(() => setLandingPapers([]));
  }, []);
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

  // The page renders nothing until mounted, so the browser's own #hash scroll
  // happens too early. Scroll to the requested section once it exists.
  useEffect(() => {
    if (!mounted || !window.location.hash) return;
    const target = document.getElementById(window.location.hash.slice(1));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-50 to-slate-50">

      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
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

        {/* Soft light falling on the right side of the hero */}
        <div
          className="absolute -right-40 top-0 w-[32rem] h-[32rem] rounded-full bg-blue-400/20 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col items-start text-left max-w-3xl">
            {/* Brand lockup */}
            <div className="mb-10">
              <BrandLockup href="/" variant="light" />
            </div>

            {/* AI-powered badge */}
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/60 bg-amber-400/10 px-4 py-1.5 text-sm font-semibold text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
              AI-powered exam preparation
            </span>

            {/* Heading */}
            <h1 className="text-6xl md:text-8xl font-bold text-white leading-none tracking-tight mb-6">
              Finance<span className="text-amber-400">Ready</span>
            </h1>

            {/* Tagline */}
            <p className="text-2xl md:text-3xl text-white font-light mb-8">
              Where Preparation Meets <span className="text-amber-400 font-semibold">Opportunity</span>
            </p>

            {/* Description */}
            <p className="text-base md:text-lg text-blue-100 mb-8 max-w-xl leading-relaxed">
              Practice with CMFAS exam papers, receive detailed feedback on every answer, and track your progress toward mastery. Designed specifically for financial advisors who demand excellence.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <a href="#signup">
                <button className="px-8 py-4 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg">
                  Start Practicing Free
                </button>
              </a>
              <Link href="/login" className="inline-block px-8 py-4 border-2 border-blue-400 text-amber-400 hover:bg-blue-400/10 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95">
                  Sign In to Continue
                </Link>
            </div>

            {/* Social Proof */}
            <div className="inline-flex items-center gap-3 bg-blue-800/50 rounded-full px-6 py-3 border border-blue-700">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full border-2 border-blue-900 flex items-center justify-center text-blue-900 font-bold text-xs">A</div>
                <div className="w-8 h-8 bg-blue-400 rounded-full border-2 border-blue-900 flex items-center justify-center text-blue-900 font-bold text-xs">J</div>
                <div className="w-8 h-8 bg-blue-700 rounded-full border-2 border-blue-900 flex items-center justify-center text-white font-bold text-xs">R</div>
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
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center mb-6">
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

      {/* Papers Section */}
      {landingPapers.length > 0 && (
        <section id="papers" className="scroll-mt-24 py-20 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Available Papers</h2>
              <p className="text-xl text-gray-600">Choose the paper you are preparing for. Create a free account to start practising.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {landingPapers.map((paper) => (
                <div key={paper.id} className="flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 leading-snug">{paper.title}</h3>
                  {paper.partLabel && (
                    <span className="inline-block self-start mt-2 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
                      {paper.partLabel}
                    </span>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-3 flex-1 mt-3">
                    {paper.description || "No description yet."}
                  </p>
                  {paper.externalLink && (
                    <a
                      href={paper.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block self-start text-sm font-medium text-blue-700 hover:text-blue-800 underline-offset-2 hover:underline"
                    >
                      Official exam info ↗
                    </a>
                  )}
                  <div className="mt-5">
                    <Link
                      href={`/?paper=${paper.id}#signup`}
                      onClick={() => setPickedPaperId(paper.id)}
                      className="inline-block w-full text-center px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition"
                    >
                      Start practising
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Papers financial advisors typically need */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Papers financial advisors typically need</h2>
            <p className="text-lg text-gray-600">Which papers you need depends on the products you advise on. Check with SCI or IBF to confirm.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { code: "RES 5", name: "Rules, Ethics and Skills for Financial Advisory Services", note: "Rules and ethics for advisers" },
              { code: "M9", name: "Life Insurance and Investment-Linked Policies", note: "Life insurance and ILP basics" },
              { code: "M9A", name: "Life Insurance and Investment-Linked Policies II", note: "Continuation of M9" },
              { code: "HI", name: "Health Insurance", note: "Health insurance products" },
            ].map((p) => (
              <div key={p.code} className="rounded-xl border border-gray-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">{p.code}</p>
                <p className="font-semibold text-gray-900 mt-1">{p.name}</p>
                <p className="text-sm text-gray-600 mt-1">{p.note}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="#papers" className="inline-block px-8 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold transition">
              See the papers available
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Designed for Your Success</h2>
            <p className="text-xl text-gray-600">Everything you need to pass your CMFAS exams</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-lg hover:border-blue-400 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ArrowTrendingUpIcon className="text-amber-400 w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Track Your Progress</h3>
              <p className="text-gray-700 text-sm">Monitor your performance across all exams with detailed analytics and score trends.</p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200 hover:shadow-lg hover:border-blue-400 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <DocumentCheckIcon className="text-amber-400 w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Multiple Papers</h3>
              <p className="text-gray-700 text-sm">Access complete CMFAS exam papers with all questions and detailed answer explanations.</p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-lg hover:border-blue-400 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BoltIcon className="text-amber-400 w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Instant Feedback</h3>
              <p className="text-gray-700 text-sm">Get immediate feedback on every answer with AI-powered explanations and learning tips.</p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:shadow-lg hover:border-blue-400 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CheckCircleIcon className="text-amber-400 w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Practice Anytime</h3>
              <p className="text-gray-700 text-sm">Study on your schedule with full-length exams, chapter reviews, and timed practice sessions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* See inside the portal: previews with example data */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">See inside the portal</h2>
            <p className="text-xl text-gray-600">Know where you stand before exam day</p>
            <p className="text-xs text-gray-500 mt-2">Previews use example data.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Preview 1: exam readiness */}
            <div className="rounded-2xl border border-gray-200 bg-slate-50 p-6 flex flex-col gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">How prepared am I?</p>
                <p className="text-xs text-gray-500">Readiness for each paper</p>
              </div>
              {[
                { paper: "Example paper A", level: "Getting there", tone: "bg-amber-100 text-amber-800", detail: "Latest exam simulation: 58% (pass mark 50%)." },
                { paper: "Example paper B", level: "Not yet ready", tone: "bg-red-100 text-red-700", detail: "Latest exam simulation: 41% (pass mark 50%)." },
              ].map((r) => (
                <div key={r.paper} className="rounded-xl bg-white border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900 text-sm">{r.paper}</p>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.tone}`}>{r.level}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{r.detail}</p>
                </div>
              ))}
            </div>

            {/* Preview 2: focus areas */}
            <div className="rounded-2xl border border-gray-200 bg-slate-50 p-6 flex flex-col gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Where to focus next</p>
                <p className="text-xs text-gray-500">Chosen from your practice results</p>
              </div>
              {[
                { ch: "Chapter 4: Example topic", note: "Only 38% correct. Work through the explanations, then retry 20 questions." },
                { ch: "Chapter 1: Example topic", note: "Good start, but mixed. Review the definitions before the next full run." },
              ].map((f) => (
                <div key={f.ch} className="rounded-xl bg-white border border-gray-200 p-4">
                  <p className="font-semibold text-gray-900 text-sm">{f.ch}</p>
                  <p className="text-xs text-gray-600 mt-1">{f.note}</p>
                </div>
              ))}
            </div>

            {/* Preview 3: exam review feedback */}
            <div className="rounded-2xl border border-gray-200 bg-slate-50 p-6 flex flex-col gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">After each exam simulation</p>
                <p className="text-xs text-gray-500">Personalised feedback on your attempt</p>
              </div>
              <div className="rounded-xl bg-white border border-gray-200 p-4 space-y-3">
                <p className="text-xs text-gray-700 leading-relaxed">
                  You passed with 62%. Your chapter results were strong in the first half and weaker on the calculation topics.
                </p>
                <div>
                  <p className="text-xs font-semibold text-green-800">Strengths</p>
                  <p className="text-xs text-gray-600">Chapter 2 and Chapter 5 at 80% or higher.</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-700">Revisit</p>
                  <p className="text-xs text-gray-600">Chapter 6, where 4 of 10 answers were correct.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <a href="#signup" className="inline-block px-8 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold transition">
              Create an account
            </a>
          </div>
        </div>
      </section>

      {/* Comparison: portal vs traditional prep */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Books and PDFs only tell you what to read</h2>
            <p className="text-xl text-gray-600">FinanceReady tells you what you still need to learn</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm md:text-base">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-5 py-4 font-semibold text-gray-900 w-1/3">What you need</th>
                  <th className="px-5 py-4 font-semibold text-gray-700 w-1/3">Traditional prep (books and PDFs)</th>
                  <th className="px-5 py-4 font-semibold text-blue-900 bg-blue-100 w-1/3">
                    <span className="inline-flex items-center gap-2">
                      FinanceReady
                      <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-blue-950">AI-powered</span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-200">
                  <td className="px-5 py-4 font-medium text-gray-900">Feedback on each answer</td>
                  <td className="px-5 py-4 text-gray-600">Read the answer key yourself</td>
                  <td className="px-5 py-4 bg-blue-50 font-medium text-blue-900">Instant feedback with an explanation</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-5 py-4 font-medium text-gray-900">Knowing which chapters to revisit</td>
                  <td className="px-5 py-4 text-gray-600">Guess from memory</td>
                  <td className="px-5 py-4 bg-blue-50 font-medium text-blue-900">AI picks focus chapters from your results</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-5 py-4 font-medium text-gray-900">Readiness for the real exam</td>
                  <td className="px-5 py-4 text-gray-600">Unclear until exam day</td>
                  <td className="px-5 py-4 bg-blue-50 font-medium text-blue-900">Readiness level per paper, from exam simulations</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-5 py-4 font-medium text-gray-900">Personalised study advice</td>
                  <td className="px-5 py-4 text-gray-600">Same plan for everyone</td>
                  <td className="px-5 py-4 bg-blue-50 font-medium text-blue-900">AI actions based on your own results</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-5 py-4 font-medium text-gray-900">Review after an exam simulation</td>
                  <td className="px-5 py-4 text-gray-600">Mark it by hand</td>
                  <td className="px-5 py-4 bg-blue-50 font-medium text-blue-900">AI feedback by chapter, with strengths and gaps</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-5 py-4 font-medium text-gray-900">Progress over time</td>
                  <td className="px-5 py-4 text-gray-600">Not tracked</td>
                  <td className="px-5 py-4 bg-blue-50 font-medium text-blue-900">Scores and trends in your Progress tab</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">How It Works</h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Sign Up', desc: 'Create your free account in seconds' },
              { step: 2, title: 'Choose Papers', desc: 'Select which CMFAS papers to practice' },
              { step: 3, title: 'Take Mock Exams', desc: 'Complete full-length or chapter practice' },
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

      {/* Sign-up section: closes the page above the footer */}
      <section id="signup" className="scroll-mt-24 bg-slate-50 px-6 py-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3">Get started</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Ready to Pass Your CMFAS Exam?
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6 max-w-md">
              Start your free practice today.
            </p>
            <ul className="space-y-3 text-gray-700 mb-10">
              <li className="flex items-center gap-3"><span className="text-amber-500 font-bold" aria-hidden="true">✓</span> Free practice with all papers</li>
              <li className="flex items-center gap-3"><span className="text-amber-500 font-bold" aria-hidden="true">✓</span> Full access to explanations</li>
            </ul>
            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Already a member?</p>
              <Link href="/login" className="inline-block px-6 py-3 border-2 border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white rounded-lg font-semibold transition-colors duration-300">
                  Sign In
                </Link>
            </div>
          </div>
          <div className="w-full max-w-md md:justify-self-end">
            <SignupForm preselectPaperId={pickedPaperId} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-300 px-6 py-10">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <p className="text-sm font-semibold text-white">
            Finance<span className="text-amber-400">Ready</span> <span className="font-normal text-gray-400">by Phillip Capital</span>
          </p>
          <p className="text-sm text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Disclaimer: Finance Ready is not related to SCI or IBF and is not the official CMFAS exam papers.
            All questions and explanations are practice materials prepared for study. For official registration and
            exam information, use the "Official exam info" link on each paper.
          </p>
          <p className="text-xs text-gray-500">© 2026 Finance Ready. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
