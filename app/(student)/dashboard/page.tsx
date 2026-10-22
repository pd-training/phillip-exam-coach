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

const STUDY_STEPS = [
  "Start with Full Practice to see which topics you already know across the paper.",
  "Practise by chapter to check your understanding. Each question gives instant feedback and an explanation.",
  "Take a quick quiz across the paper to revise topics you may have forgotten.",
  "When you feel ready, sit a full exam under timed conditions.",
  "Review every answer in the exam review and read the explanations for the ones you missed.",
  "Check Progress to see which chapters need work, then go back to step 2 for those chapters.",
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
                onClick={() => setShowSteps(true)}
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
                <h3 className="font-semibold text-gray-900 leading-snug mb-2">{paper.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-3 flex-1">
                  {paper.description || "No description yet."}
                </p>
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
            <ol className="space-y-3">
              {STUDY_STEPS.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-800">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-900 text-white text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
