"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import StudentNav from "@/components/StudentNav";

type PaperSummary = {
  id: string;
  title: string;
  description: string | null;
  totalTime: number | null;
};

type PaperRequest = { paperId: string; status: string };

const STEP_SVG = "w-full h-auto";

const STUDY_STEPS: { title: string; body: string; illustration: React.ReactNode }[] = [
  {
    title: "Read the official notes first",
    body: "Start with the study notes and guides on the SCI or IBF portal. Get a feel for the topics before you test yourself.",
    illustration: (
      <svg viewBox="0 0 320 150" className={STEP_SVG} role="img" aria-label="Stack of study notes">
        <rect x="90" y="30" width="150" height="100" rx="6" fill="#e0e7ff" stroke="#1e3a8a" strokeWidth="2" />
        <rect x="105" y="22" width="150" height="100" rx="6" fill="#c7d2fe" stroke="#1e3a8a" strokeWidth="2" />
        <rect x="120" y="14" width="150" height="100" rx="6" fill="#ffffff" stroke="#1e3a8a" strokeWidth="2" />
        <line x1="138" y1="40" x2="250" y2="40" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        <line x1="138" y1="58" x2="250" y2="58" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        <line x1="138" y1="76" x2="225" y2="76" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        <line x1="138" y1="94" x2="240" y2="94" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Do a Full Practice run",
    body: "Answer 50 questions across the whole paper with no timer. It shows which topics you already know.",
    illustration: (
      <svg viewBox="0 0 320 150" className={STEP_SVG} role="img" aria-label="Full practice results by topic">
        {[
          { y: 20, w: 200, c: "#16a34a" },
          { y: 52, w: 140, c: "#f59e0b" },
          { y: 84, w: 230, c: "#16a34a" },
          { y: 116, w: 90, c: "#dc2626" },
        ].map((b, i) => (
          <g key={i}>
            <text x="8" y={b.y + 15} fontSize="12" fill="#475569">Ch {i + 1}</text>
            <rect x="60" y={b.y} width={b.w} height="20" rx="4" fill={b.c} />
          </g>
        ))}
      </svg>
    ),
  },
  {
    title: "Check your recommended chapters",
    body: "Your results highlight the chapters that need the most work. Start there.",
    illustration: (
      <svg viewBox="0 0 320 150" className={STEP_SVG} role="img" aria-label="Chapters below the 60 percent line">
        <line x1="20" y1="60" x2="300" y2="60" stroke="#1e3a8a" strokeWidth="2" strokeDasharray="6 4" />
        <text x="252" y="54" fontSize="11" fill="#1e3a8a">60%</text>
        {[
          { x: 36, h: 90, c: "#94a3b8" },
          { x: 96, h: 110, c: "#94a3b8" },
          { x: 156, h: 40, c: "#f59e0b" },
          { x: 216, h: 75, c: "#94a3b8" },
          { x: 262, h: 30, c: "#f59e0b" },
        ].map((b, i) => (
          <rect key={i} x={b.x} y={140 - b.h} width="36" height={b.h} rx="4" fill={b.c} />
        ))}
      </svg>
    ),
  },
  {
    title: "Read every explanation",
    body: "After each answer, read the explanation carefully. Do not just memorise the answers.",
    illustration: (
      <svg viewBox="0 0 320 150" className={STEP_SVG} role="img" aria-label="Question with explanation">
        <rect x="20" y="14" width="280" height="30" rx="6" fill="#f1f5f9" />
        <rect x="20" y="52" width="280" height="24" rx="6" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
        <text x="32" y="69" fontSize="12" fill="#14532d">✓  Option B</text>
        <rect x="20" y="84" width="280" height="24" rx="6" fill="#ffffff" stroke="#cbd5e1" />
        <text x="32" y="101" fontSize="12" fill="#475569">   Option C</text>
        <rect x="20" y="118" width="280" height="26" rx="6" fill="#eff6ff" stroke="#93c5fd" />
        <line x1="32" y1="131" x2="200" y2="131" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Attempt an Exam Simulation",
    body: "When you feel ready, sit a timed exam simulation under exam conditions.",
    illustration: (
      <svg viewBox="0 0 320 150" className={STEP_SVG} role="img" aria-label="Timed exam gauge">
        <path d="M60 120 A100 100 0 0 1 260 120" fill="none" stroke="#e2e8f0" strokeWidth="16" strokeLinecap="round" />
        <path d="M60 120 A100 100 0 0 1 200 40" fill="none" stroke="#1e3a8a" strokeWidth="16" strokeLinecap="round" />
        <line x1="160" y1="120" x2="208" y2="48" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
        <circle cx="160" cy="120" r="6" fill="#0f172a" />
        <text x="160" y="145" fontSize="12" textAnchor="middle" fill="#475569">Timed, like the real exam</text>
      </svg>
    ),
  },
  {
    title: "Do Quick Quizzes often",
    body: "Take a Quick Quiz whenever you are free, and again just before the exam.",
    illustration: (
      <svg viewBox="0 0 320 150" className={STEP_SVG} role="img" aria-label="Quick quiz answer grid">
        {Array.from({ length: 15 }).map((_, i) => {
          const correct = [0, 1, 3, 4, 6, 7, 8, 10, 11, 13, 14].includes(i);
          return (
            <rect
              key={i}
              x={20 + (i % 5) * 58}
              y={20 + Math.floor(i / 5) * 42}
              width="46"
              height="30"
              rx="6"
              fill={correct ? "#dcfce7" : "#fee2e2"}
              stroke={correct ? "#16a34a" : "#dc2626"}
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
    ),
  },
  {
    title: "Track your progress",
    body: "Use the Progress tab to see your results over time and the questions you get wrong.",
    illustration: (
      <svg viewBox="0 0 320 150" className={STEP_SVG} role="img" aria-label="Score trend line">
        <line x1="24" y1="130" x2="300" y2="130" stroke="#cbd5e1" />
        <line x1="24" y1="20" x2="24" y2="130" stroke="#cbd5e1" />
        <polyline points="40,110 100,94 160,80 220,58 290,36" fill="none" stroke="#1e3a8a" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {[[40,110],[100,94],[160,80],[220,58],[290,36]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5" fill="#ffffff" stroke="#1e3a8a" strokeWidth="2.5" />
        ))}
      </svg>
    ),
  },
];

// Time-based greeting in the student's local time
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function StudentDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [papers, setPapers] = useState<PaperSummary[]>([]);
  const [accessibleIds, setAccessibleIds] = useState<Set<string>>(new Set());
  const [requests, setRequests] = useState<PaperRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSteps, setShowSteps] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Send admins to their dashboard and signed-out users to login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && (session?.user as any)?.role === "ADMIN") {
      router.push("/admin/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/papers/available").then((r) => (r.ok ? r.json() : { papers: [] })),
      fetch("/api/student/papers").then((r) => (r.ok ? r.json() : { papers: [] })),
      fetch("/api/student/paper-requests").then((r) => (r.ok ? r.json() : { requests: [] })),
    ])
      .then(([available, mine, reqs]) => {
        setPapers(available.papers || []);
        setAccessibleIds(new Set((mine.papers || []).map((p: any) => p.paperId)));
        setRequests(reqs.requests || []);
      })
      .catch((err) => console.error("Dashboard load error:", err))
      .finally(() => setLoading(false));
  }, [status]);

  // Close the steps pop-out with Escape
  useEffect(() => {
    if (!showSteps) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowSteps(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSteps]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentNav />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const yourPapers = papers.filter((p) => accessibleIds.has(p.id));

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {greeting()}, {session?.user?.name || "there"}!
          </h1>
          <p className="text-gray-600 mt-1">Learn how the portal works, then start learning.</p>
        </div>

        {/* Two ribbons: how to use the portal, and unlocking more papers */}
        <div className="mb-10 grid gap-5 md:grid-cols-2">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">How to use the portal effectively</h2>
              <p className="text-sm text-gray-600 mt-1">A simple study path from first read to exam day.</p>
            </div>
            <div>
              <button
                onClick={() => {
                  setStepIndex(0);
                  setShowSteps(true);
                }}
                className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition"
              >
                View the steps
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Unlock papers</h2>
              <p className="text-sm text-gray-600 mt-1">Choose more papers to practise, or request one you do not have yet.</p>
            </div>
            <div>
              <Link
                href="/papers"
                className="inline-block px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition"
              >
                View papers
              </Link>
            </div>
          </div>
        </div>

        {/* Papers the student can access */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your papers</h2>
        {yourPapers.length === 0 ? (
          <p className="text-gray-600">
            You don&apos;t have any papers yet.{" "}
            <Link href="/papers" className="font-semibold text-blue-700 hover:text-blue-800">View papers</Link> to request one.
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {yourPapers.map((paper) => (
              <Link
                key={paper.id}
                href={`/exam/${paper.id}`}
                className="group flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-blue-300 transition"
              >
                <h3 className="font-semibold text-gray-900 leading-snug flex-1">{paper.title}</h3>
                <div className="mt-4 flex items-center justify-end text-sm">
                  <span className="font-semibold text-blue-700 group-hover:text-blue-800">Start practising →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* How to use the portal: pop-out */}
      {showSteps && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
          onClick={() => setShowSteps(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="steps-title"
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 id="steps-title" className="text-xl font-bold text-gray-900">How to use the portal effectively</h2>
              <button
                onClick={() => setShowSteps(false)}
                className="text-gray-500 hover:text-gray-900 text-sm font-medium"
                aria-label="Close"
              >
                Close
              </button>
            </div>
            {(() => {
              const step = STUDY_STEPS[stepIndex];
              const isLast = stepIndex === STUDY_STEPS.length - 1;
              return (
                <div>
                  <div className="rounded-xl bg-slate-50 border border-gray-200 p-4 mb-5">
                    {step.illustration}
                  </div>
                  <p className="text-xs font-semibold text-blue-700 mb-1">
                    Step {stepIndex + 1} of {STUDY_STEPS.length}
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed min-h-[3.5rem]">{step.body}</p>

                  <div className="flex items-center justify-between gap-3 mt-6">
                    <div className="flex gap-1.5" aria-hidden="true">
                      {STUDY_STEPS.map((_, i) => (
                        <span
                          key={i}
                          className={`h-2 w-2 rounded-full ${i === stepIndex ? "bg-blue-900" : "bg-gray-300"}`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                        disabled={stepIndex === 0}
                        className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => (isLast ? setShowSteps(false) : setStepIndex((i) => i + 1))}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-900 hover:bg-blue-800 text-white transition"
                      >
                        {isLast ? "Finish" : "Next"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
