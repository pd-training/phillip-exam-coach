"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import StudentNav from "@/components/StudentNav";

type PaperOption = { paperId: string; paper_name: string };
type GuideChapter = { chapterNumber: number; title: string; tldr: string; bullets: string[] };

export default function QuickGuidePage() {
  const router = useRouter();
  const { status } = useSession();
  const [papers, setPapers] = useState<PaperOption[]>([]);
  const [paperId, setPaperId] = useState<string>("");
  const [chapters, setChapters] = useState<GuideChapter[]>([]);
  const [openChapter, setOpenChapter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [guideLoading, setGuideLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/student/papers")
      .then((r) => (r.ok ? r.json() : { papers: [] }))
      .then((data) => {
        const list: PaperOption[] = data.papers || [];
        setPapers(list);
        if (list.length > 0) setPaperId(list[0].paperId);
      })
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    if (!paperId) return;
    setGuideLoading(true);
    setOpenChapter(null);
    fetch(`/api/guide/${paperId}`)
      .then((r) => (r.ok ? r.json() : { chapters: [] }))
      .then((data) => setChapters(data.chapters || []))
      .finally(() => setGuideLoading(false));
  }, [paperId]);

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

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900">Quick Guide</h1>
        <p className="text-gray-600 mt-1">Condensed study notes for quick revision before your exam.</p>

        {papers.length === 0 ? (
          <p className="mt-8 text-gray-600">You don&apos;t have access to any papers yet. Request a paper from the dashboard to see its guide.</p>
        ) : (
          <>
            <div className="mt-6">
              <label htmlFor="guide-paper" className="block text-sm font-medium text-gray-700 mb-1.5">Paper</label>
              <select
                id="guide-paper"
                value={paperId}
                onChange={(e) => setPaperId(e.target.value)}
                className="w-full md:w-96 px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              >
                {papers.map((p) => (
                  <option key={p.paperId} value={p.paperId}>{p.paper_name}</option>
                ))}
              </select>
            </div>

            <div className="mt-8 space-y-3">
              {guideLoading && <p className="text-gray-600 text-sm">Loading guide...</p>}
              {!guideLoading && chapters.length === 0 && (
                <p className="text-gray-600 text-sm">No chapters for this paper yet.</p>
              )}
              {!guideLoading && chapters.map((ch) => {
                const isOpen = openChapter === ch.chapterNumber;
                const hasNotes = ch.tldr || ch.bullets.length > 0;
                return (
                  <div key={ch.chapterNumber} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setOpenChapter(isOpen ? null : ch.chapterNumber)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition"
                    >
                      <span className="font-semibold text-gray-900">Chapter {ch.chapterNumber} - {ch.title}</span>
                      <span className="text-blue-600 text-sm font-medium">{isOpen ? "Hide" : "Open"}</span>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-gray-100">
                        {!hasNotes ? (
                          <p className="pt-4 text-sm text-gray-600">Notes for this chapter are coming soon.</p>
                        ) : (
                          <>
                            {ch.tldr && (
                              <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-4">
                                <p className="text-xs font-semibold text-blue-900 mb-1">TL;DR</p>
                                <p className="text-sm text-blue-900 leading-relaxed">{ch.tldr}</p>
                              </div>
                            )}
                            {ch.bullets.length > 0 && (
                              <>
                                <p className="mt-5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Core knowledge</p>
                                <ul className="mt-2 space-y-2 list-disc pl-5 text-sm text-gray-800 leading-relaxed">
                                  {ch.bullets.map((b, i) => <li key={i}>{b}</li>)}
                                </ul>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
