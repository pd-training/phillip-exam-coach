"use client";

import { useEffect, useState } from "react";

type GuideChapter = { chapterNumber: number; title: string; tldr: string; bullets: string[] };

// Admin editor for the chapter Quick Guide (60-second TL;DR and core bullets).
// Shown as a tab on the paper page.
export default function GuideEditor({ paperId }: { paperId: string }) {
  const [chapters, setChapters] = useState<GuideChapter[]>([]);
  const [drafts, setDrafts] = useState<Record<number, { tldr: string; bullets: string }>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/guide/${paperId}`)
      .then((r) => (r.ok ? r.json() : { chapters: [] }))
      .then((data) => {
        const list: GuideChapter[] = data.chapters || [];
        setChapters(list);
        const next: Record<number, { tldr: string; bullets: string }> = {};
        list.forEach((c) => {
          next[c.chapterNumber] = { tldr: c.tldr, bullets: c.bullets.join("\n") };
        });
        setDrafts(next);
      })
      .finally(() => setLoading(false));
  }, [paperId]);

  const updateDraft = (chapterNumber: number, field: "tldr" | "bullets", value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [chapterNumber]: { ...(prev[chapterNumber] || { tldr: "", bullets: "" }), [field]: value },
    }));
  };

  const saveChapter = async (chapterNumber: number) => {
    const draft = drafts[chapterNumber] || { tldr: "", bullets: "" };
    setSaving(chapterNumber);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/guide/${paperId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterNumber,
          tldr: draft.tldr,
          bullets: draft.bullets.split("\n"),
        }),
      });
      setMessage(res.ok ? `Chapter ${chapterNumber} saved` : "Could not save. Please try again.");
    } catch {
      setMessage("Could not save. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <p className="text-gray-600 text-sm">
        Write a 60-second TL;DR and core knowledge bullets for each chapter. One bullet per line. Students see these in the Quick Guide.
      </p>
      {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}

      <div className="mt-6 space-y-5">
        {loading && <p className="text-gray-600 text-sm">Loading chapters...</p>}
        {!loading && chapters.length === 0 && <p className="text-gray-600 text-sm">No chapters for this paper yet.</p>}
        {!loading && chapters.map((ch) => {
          const draft = drafts[ch.chapterNumber] || { tldr: "", bullets: "" };
          return (
            <div key={ch.chapterNumber} className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Chapter {ch.chapterNumber} - {ch.title}</h3>

              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor={`tldr-${ch.chapterNumber}`}>
                60-second TL;DR
              </label>
              <textarea
                id={`tldr-${ch.chapterNumber}`}
                value={draft.tldr}
                onChange={(e) => updateDraft(ch.chapterNumber, "tldr", e.target.value)}
                rows={3}
                maxLength={600}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              />

              <label className="block text-sm font-medium text-gray-700 mt-4 mb-1.5" htmlFor={`bullets-${ch.chapterNumber}`}>
                Core knowledge (one bullet per line)
              </label>
              <textarea
                id={`bullets-${ch.chapterNumber}`}
                value={draft.bullets}
                onChange={(e) => updateDraft(ch.chapterNumber, "bullets", e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              />

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => saveChapter(ch.chapterNumber)}
                  disabled={saving === ch.chapterNumber}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {saving === ch.chapterNumber ? "Saving..." : "Save chapter"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
