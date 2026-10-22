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

export default function AllPapersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [papers, setPapers] = useState<PaperSummary[]>([]);
  const [accessibleIds, setAccessibleIds] = useState<Set<string>>(new Set());
  const [requests, setRequests] = useState<PaperRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role === "ADMIN") router.push("/admin/dashboard");
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
      .catch((err) => console.error("Papers load error:", err))
      .finally(() => setLoading(false));
  }, [status]);

  const stateFor = (paperId: string) => {
    if (accessibleIds.has(paperId)) return "available";
    const req = requests.find((r) => r.paperId === paperId);
    if (req?.status === "pending") return "pending";
    return "locked";
  };

  const requestPaper = async (paperId: string) => {
    setBusyId(paperId);
    setMessage("");
    try {
      const res = await fetch("/api/student/paper-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId }),
      });
      if (!res.ok) throw new Error("Request failed");
      setRequests((prev) => [...prev.filter((r) => r.paperId !== paperId), { paperId, status: "pending" }]);
      setMessage("Request sent. We will review it and unlock the paper for you.");
    } catch {
      setMessage("Could not send the request. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <Link href="/dashboard" className="text-sm font-medium text-blue-700 hover:text-blue-800">
          ← Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">All papers</h1>
        <p className="text-gray-600 mt-1">Papers you have access to can be practised now. Request the others to unlock them.</p>

        {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {papers.map((paper) => {
            const state = stateFor(paper.id);
            return (
              <div key={paper.id} className="flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="font-semibold text-gray-900 leading-snug">{paper.title}</h2>
                  {state === "available" && (
                    <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">Available</span>
                  )}
                  {state === "pending" && (
                    <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Request pending</span>
                  )}
                  {state === "locked" && (
                    <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">Locked</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-3 flex-1">{paper.description || "No description yet."}</p>
                <div className="mt-4 flex items-center justify-end gap-3">
                  {state === "available" && (
                    <Link
                      href={`/exam/${paper.id}`}
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition"
                    >
                      Start practising
                    </Link>
                  )}
                  {state === "locked" && (
                    <button
                      type="button"
                      onClick={() => requestPaper(paper.id)}
                      disabled={busyId === paper.id}
                      className="px-4 py-2 border border-blue-900 text-blue-900 hover:bg-blue-50 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                    >
                      {busyId === paper.id ? "Sending..." : "Request paper"}
                    </button>
                  )}
                  {state === "pending" && (
                    <span className="text-sm font-medium text-amber-700">Awaiting review</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {papers.length === 0 && <p className="mt-8 text-gray-600">No papers are available yet.</p>}
      </div>
    </div>
  );
}
