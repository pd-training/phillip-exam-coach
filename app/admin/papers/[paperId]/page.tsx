"use client";

import AdminNav from "@/components/AdminNav";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

interface Paper {
  id: string;
  title: string;
  description?: string;
  externalLink?: string;
  durationMinutes: number;
  totalQuestions: number;
  isAvailable: boolean;
  passingScore?: number;
  createdAt: string;
}

interface ExamPart {
  id: string;
  partName: string;
  chapterStart: number;
  chapterEnd: number;
  questionCount: number;
  passingScore: number;
  orderIndex: number;
}

type TabType = "settings" | "format" | "questions" | "chapters";

export default function PaperDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();

  const paperId = params.paperId as string;
  const [activeTab, setActiveTab] = useState<TabType>("settings");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Paper data
  const [paper, setPaper] = useState<Paper | null>(null);
  const [parts, setParts] = useState<ExamPart[]>([]);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [duration, setDuration] = useState("");
  const [passingScore, setPassingScore] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchPaperData();
    }
  }, [status, paperId]);

  const fetchPaperData = async () => {
    try {
      setLoading(true);

      // Fetch paper details
      const paperRes = await fetch(`/api/papers/${paperId}`);
      const paperData = await paperRes.json();
      const paperInfo = paperData.paper;
      setPaper(paperInfo);

      setTitle(paperInfo.title || "");
      setDescription(paperInfo.description || "");
      setExternalLink(paperInfo.externalLink || "");
      setDuration(paperInfo.durationMinutes?.toString() || "120");
      setPassingScore(paperInfo.passingScore?.toString() || "70");
      setIsAvailable(paperInfo.isAvailable || false);

      // Fetch exam format
      const formatRes = await fetch(`/api/papers/${paperId}/exam-format`);
      const formatData = await formatRes.json();
      setParts(formatData.examFormat?.parts || []);
    } catch (error) {
      console.error("Error fetching paper data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSubmitting(true);

      const res = await fetch(`/api/admin/papers/${paperId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          externalLink,
          durationMinutes: parseInt(duration),
          passingScore: parseInt(passingScore),
          isAvailable,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      const data = await res.json();
      setPaper(data.paper);
      alert("Settings saved successfully");
    } catch (error) {
      alert("Error saving settings: " + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePaper = async () => {
    try {
      setSubmitting(true);

      const res = await fetch(`/api/admin/papers/${paperId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      alert("Paper deleted successfully");
      router.push("/admin/papers");
    } catch (error) {
      alert("Error deleting paper: " + (error as Error).message);
      setShowDeleteConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Paper not found</p>
        </div>
      </div>
    );
  }

  const totalQuestions = parts.reduce((sum, part) => sum + part.questionCount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <button
                onClick={() => router.push("/admin/papers")}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
              >
                ← Back to Papers
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{paper.title}</h1>
              <p className="text-gray-600 mt-1">{totalQuestions} questions • {paper.durationMinutes} min</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                Upload Questions
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
              >
                Delete Paper
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8">
              {(["settings", "format", "questions", "chapters"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-0 py-4 font-medium text-sm border-b-2 transition ${
                    activeTab === tab
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-gray-700 hover:text-gray-900"
                  }`}
                >
                  {tab === "settings" && "Settings"}
                  {tab === "format" && "Exam Format"}
                  {tab === "questions" && "Questions"}
                  {tab === "chapters" && "Chapters"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-6 uppercase text-gray-600 text-xs tracking-wider">
                Basic Information
              </h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paper Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">External Link (optional)</label>
                  <input
                    type="url"
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <h2 className="text-lg font-semibold mb-6 uppercase text-gray-600 text-xs tracking-wider">
                Exam Configuration
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Passing Score (%)</label>
                  <input
                    type="number"
                    value={passingScore}
                    onChange={(e) => setPassingScore(e.target.value)}
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <h2 className="text-lg font-semibold mb-6 uppercase text-gray-600 text-xs tracking-wider">
                Availability
              </h2>
              <div className="flex items-center gap-3 mb-8">
                <input
                  type="checkbox"
                  id="availability"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-5 h-5 rounded cursor-pointer"
                />
                <label htmlFor="availability" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Make this paper available to students
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveSettings}
                  disabled={submitting}
                  className="px-6 py-2 bg-amber-500 text-gray-900 font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50 transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => fetchPaperData()}
                  className="px-6 py-2 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exam Format Tab */}
        {activeTab === "format" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6 uppercase text-gray-600 text-xs tracking-wider">
              Exam Parts
            </h2>
            <div className="space-y-3 mb-6">
              {parts.length === 0 ? (
                <p className="text-gray-500">No exam parts configured</p>
              ) : (
                parts.map((part) => (
                  <div key={part.id} className="bg-gray-100 p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{part.partName}</p>
                      <p className="text-sm text-gray-600">
                        Chapters {part.chapterStart}–{part.chapterEnd} • {part.questionCount} questions • {part.passingScore}% pass score
                      </p>
                    </div>
                    <button className="px-3 py-1 bg-white text-gray-900 border border-gray-300 rounded text-sm hover:bg-gray-50">
                      Edit
                    </button>
                  </div>
                ))
              )}
            </div>
            <button className="px-6 py-2 bg-amber-500 text-gray-900 font-semibold rounded-lg hover:bg-amber-600 transition">
              + Add Part
            </button>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === "questions" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <p className="text-4xl mb-4">📄</p>
              <p className="text-gray-600">View and manage all questions for this paper. Upload new questions, search, edit, and delete as needed.</p>
            </div>
          </div>
        )}

        {/* Chapters Tab */}
        {activeTab === "chapters" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6 uppercase text-gray-600 text-xs tracking-wider">
              Chapter Titles
            </h2>
            <div className="space-y-4 mb-6">
              {[1, 2, 3, 4, 5].map((ch) => (
                <div key={ch}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chapter {ch}</label>
                  <input
                    type="text"
                    placeholder={`Chapter ${ch}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-2 bg-amber-500 text-gray-900 font-semibold rounded-lg hover:bg-amber-600 transition">
                Save Changes
              </button>
              <button className="px-6 py-2 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Paper</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "<strong>{paper.title}</strong>"? This action cannot be undone.
            </p>
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                This will also delete all associated exam parts and questions.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={submitting}
                className="px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePaper}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? "Deleting..." : "Delete Paper"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
