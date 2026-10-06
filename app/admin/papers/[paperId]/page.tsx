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

type TabType = "settings" | "questions" | "chapters";

export default function PaperDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();

  const paperId = params.paperId as string;
  const [activeTab, setActiveTab] = useState<TabType>("settings");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);

  // Paper data
  const [paper, setPaper] = useState<Paper | null>(null);
  const [parts, setParts] = useState<ExamPart[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [chaptersError, setChaptersError] = useState<string>("");

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"APPEND" | "REPLACE">("APPEND");
  const [uploadProgress, setUploadProgress] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [duration, setDuration] = useState("");
  const [passingScore, setPassingScore] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);

  // Edit question form
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editAnswer, setEditAnswer] = useState("A");
  const [editChapter, setEditChapter] = useState("1");
  const [editExplanation, setEditExplanation] = useState("");
  const [editOptionA, setEditOptionA] = useState("");
  const [editOptionB, setEditOptionB] = useState("");
  const [editOptionC, setEditOptionC] = useState("");
  const [editOptionD, setEditOptionD] = useState("");

  // Exam parts form
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [partName, setPartName] = useState("");
  const [partChapterStart, setPartChapterStart] = useState("");
  const [partChapterEnd, setPartChapterEnd] = useState("");
  const [partQuestionCount, setPartQuestionCount] = useState("");
  const [partPassingScore, setPartPassingScore] = useState("70");

  // Edit exam part
  const [showEditPartModal, setShowEditPartModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<ExamPart | null>(null);
  const [editPartName, setEditPartName] = useState("");
  const [editPartChapterStart, setEditPartChapterStart] = useState("");
  const [editPartChapterEnd, setEditPartChapterEnd] = useState("");
  const [editPartQuestionCount, setEditPartQuestionCount] = useState("");
  const [editPartPassingScore, setEditPartPassingScore] = useState("70");

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

      // Fetch questions from paper data
      setQuestions(paperInfo.questions || []);

      // Fetch exam format
      const formatRes = await fetch(`/api/papers/${paperId}/exam-format`);
      const formatData = await formatRes.json();
      setParts(formatData.examFormat?.parts || []);

      // Fetch chapters
      try {
        const chaptersRes = await fetch(`/api/admin/papers/${paperId}/chapters`, {
          method: "GET",
          credentials: "include",
        });
        const chaptersData = await chaptersRes.json();
        if (chaptersRes.ok) {
          console.log("Chapters data:", chaptersData);
          setChapters(Array.isArray(chaptersData) ? chaptersData : []);
          setChaptersError("");
        } else {
          console.error("Error fetching chapters:", chaptersData);
          setChaptersError(chaptersData?.error || "Failed to fetch chapters");
          setChapters([]);
        }
      } catch (error) {
        console.error("Error fetching chapters:", error);
        setChaptersError((error as Error).message);
        setChapters([]);
      }
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

  const handleUploadQuestions = async () => {
    if (!uploadFile || !paperId) {
      alert("Please select a file");
      return;
    }

    try {
      setSubmitting(true);
      setUploadProgress("Uploading...");

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("mode", uploadMode);

      const res = await fetch(`/api/papers/${paperId}/questions/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        const modeText = uploadMode === "APPEND" ? "appended" : "replaced";
        setUploadProgress(`${data.count} questions ${modeText} successfully!`);
        await fetchPaperData();
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadFile(null);
          setUploadProgress("");
          setUploadMode("APPEND");
        }, 2000);
      } else {
        setUploadProgress(`Error: ${data.error}`);
      }
    } catch (error) {
      setUploadProgress(`Upload failed: ${(error as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditQuestion = (question: any) => {
    setSelectedQuestion(question);
    setEditQuestionText(question.questionText || "");
    setEditAnswer(question.correctAnswer || "A");
    setEditChapter(question.chapterNumber?.toString() || "1");
    setEditExplanation(question.explanation || "");
    setEditOptionA(question.optionA || "");
    setEditOptionB(question.optionB || "");
    setEditOptionC(question.optionC || "");
    setEditOptionD(question.optionD || "");
    setShowEditModal(true);
  };

  const handleUpdateQuestion = async () => {
    if (!selectedQuestion || !editQuestionText.trim()) {
      alert("Question text is required");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(
        `/api/papers/${paperId}/questions/${selectedQuestion.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionText: editQuestionText,
            correctAnswer: editAnswer,
            chapterNumber: parseInt(editChapter),
            explanation: editExplanation,
            optionA: editOptionA,
            optionB: editOptionB,
            optionC: editOptionC,
            optionD: editOptionD,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to update");

      alert("Question updated successfully");
      await fetchPaperData();
      setShowEditModal(false);
    } catch (error) {
      alert("Error updating question: " + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      setSubmitting(true);

      const res = await fetch(
        `/api/papers/${paperId}/questions/${questionId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to delete");

      alert("Question deleted successfully");
      await fetchPaperData();
    } catch (error) {
      alert("Error deleting question: " + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPart = async () => {
    if (!partName.trim() || !partChapterStart || !partChapterEnd || !partQuestionCount) {
      alert("Please fill in all part details");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`/api/papers/${paperId}/exam-format/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partName: partName.trim(),
          chapterStart: parseInt(partChapterStart),
          chapterEnd: parseInt(partChapterEnd),
          questionCount: parseInt(partQuestionCount),
          passingScore: parseInt(partPassingScore),
        }),
      });

      if (!res.ok) throw new Error("Failed to add part");

      alert("Exam part added successfully");
      setShowAddPartModal(false);
      setPartName("");
      setPartChapterStart("");
      setPartChapterEnd("");
      setPartQuestionCount("");
      setPartPassingScore("70");
      await fetchPaperData();
    } catch (error) {
      alert("Error adding part: " + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPart = (part: ExamPart) => {
    setSelectedPart(part);
    setEditPartName(part.partName);
    setEditPartChapterStart(part.chapterStart.toString());
    setEditPartChapterEnd(part.chapterEnd.toString());
    setEditPartQuestionCount(part.questionCount.toString());
    setEditPartPassingScore(part.passingScore.toString());
    setShowEditPartModal(true);
  };

  const handleUpdatePart = async () => {
    if (!editPartName.trim() || !editPartChapterStart || !editPartChapterEnd || !editPartQuestionCount) {
      alert("Please fill in all part details");
      return;
    }

    if (!selectedPart) return;

    try {
      setSubmitting(true);

      const res = await fetch(`/api/papers/${paperId}/exam-format/parts/${selectedPart.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partName: editPartName.trim(),
          chapterStart: parseInt(editPartChapterStart),
          chapterEnd: parseInt(editPartChapterEnd),
          questionCount: parseInt(editPartQuestionCount),
          passingScore: parseInt(editPartPassingScore),
        }),
      });

      if (!res.ok) throw new Error("Failed to update part");

      alert("Exam part updated successfully");
      setShowEditPartModal(false);
      setSelectedPart(null);
      await fetchPaperData();
    } catch (error) {
      alert("Error updating part: " + (error as Error).message);
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
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
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
              {(["settings", "questions", "chapters"] as TabType[]).map((tab) => (
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
              <div className="grid grid-cols-3 gap-4 mb-6">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">No. of Questions</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-semibold text-gray-900">
                    {parts.reduce((sum, part) => sum + part.questionCount, 0)}
                  </div>
                </div>
              </div>

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
                      <button
                        onClick={() => handleEditPart(part)}
                        className="px-3 py-1 bg-white text-gray-900 border border-gray-300 rounded text-sm hover:bg-gray-50"
                      >
                        Edit
                      </button>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => setShowAddPartModal(true)}
                className="mb-6 px-6 py-2 bg-amber-500 text-gray-900 font-semibold rounded-lg hover:bg-amber-600 transition"
              >
                + Add Exam Part
              </button>

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

        {/* Questions Tab */}
        {activeTab === "questions" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6 uppercase text-gray-600 text-xs tracking-wider">
              Question Bank ({questions.length})
            </h2>

            {questions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No questions uploaded yet. Use the "Upload Questions" button to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Chapter</th>
                      <th className="px-4 py-3 text-left font-semibold">Question</th>
                      <th className="px-4 py-3 text-left font-semibold">Answer</th>
                      <th className="px-4 py-3 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q) => (
                      <tr key={q.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{q.chapterNumber}</td>
                        <td className="px-4 py-3 text-gray-700 truncate max-w-xs">{q.questionText?.substring(0, 50)}...</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{q.correctAnswer}</td>
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => handleEditQuestion(q)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Chapters Tab */}
        {activeTab === "chapters" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6 uppercase text-gray-600 text-xs tracking-wider">
              Chapter Titles
            </h2>
            {chaptersError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                Error: {chaptersError}
              </div>
            )}
            {chapters.length === 0 ? (
              <p className="text-gray-500 mb-6">No chapters configured yet.</p>
            ) : (
              <div className="space-y-4 mb-6">
                {chapters.map((ch) => (
                  <div key={ch.number}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chapter {ch.number}</label>
                    <input
                      type="text"
                      defaultValue={ch.title || ""}
                      placeholder={`Chapter ${ch.number}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                ))}
              </div>
            )}
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

      {/* Upload Questions Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Upload Questions</h3>

            <p className="text-sm text-gray-600 mb-4">
              <strong>CSV Formats Supported:</strong><br/>
              • <strong>8-column:</strong> Chapter, Question, Option A, Option B, Option C, Option D, Answer (A-D), Explanation<br/>
              • <strong>4-column:</strong> Chapter, Question, Answer (A-D), Explanation
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Mode</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="APPEND"
                    checked={uploadMode === "APPEND"}
                    onChange={(e) => setUploadMode(e.target.value as "APPEND" | "REPLACE")}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Append to existing</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="REPLACE"
                    checked={uploadMode === "REPLACE"}
                    onChange={(e) => setUploadMode(e.target.value as "APPEND" | "REPLACE")}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Replace all</span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {uploadProgress && (
              <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg">
                {uploadProgress}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadProgress("");
                }}
                disabled={submitting}
                className="px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadQuestions}
                disabled={!uploadFile || submitting}
                className="px-4 py-2 bg-amber-500 text-gray-900 font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                {submitting ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {showEditModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 my-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Question</h3>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chapter Number</label>
                <input
                  type="number"
                  value={editChapter}
                  onChange={(e) => setEditChapter(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
                <textarea
                  value={editQuestionText}
                  onChange={(e) => setEditQuestionText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Option A</label>
                  <input
                    type="text"
                    value={editOptionA}
                    onChange={(e) => setEditOptionA(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Option B</label>
                  <input
                    type="text"
                    value={editOptionB}
                    onChange={(e) => setEditOptionB(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Option C</label>
                  <input
                    type="text"
                    value={editOptionC}
                    onChange={(e) => setEditOptionC(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Option D</label>
                  <input
                    type="text"
                    value={editOptionD}
                    onChange={(e) => setEditOptionD(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
                <select
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Explanation</label>
                <textarea
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={submitting}
                className="px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateQuestion}
                disabled={submitting}
                className="px-4 py-2 bg-amber-500 text-gray-900 font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Exam Part Modal */}
      {showAddPartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Add Exam Part</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Part Name</label>
                <input
                  type="text"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  placeholder="e.g., Part A, Section 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chapter Start</label>
                  <input
                    type="number"
                    value={partChapterStart}
                    onChange={(e) => setPartChapterStart(e.target.value)}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chapter End</label>
                  <input
                    type="number"
                    value={partChapterEnd}
                    onChange={(e) => setPartChapterEnd(e.target.value)}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">No. of Questions</label>
                <input
                  type="number"
                  value={partQuestionCount}
                  onChange={(e) => setPartQuestionCount(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passing Score (%)</label>
                <input
                  type="number"
                  value={partPassingScore}
                  onChange={(e) => setPartPassingScore(e.target.value)}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddPartModal(false);
                  setPartName("");
                  setPartChapterStart("");
                  setPartChapterEnd("");
                  setPartQuestionCount("");
                  setPartPassingScore("70");
                }}
                disabled={submitting}
                className="px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPart}
                disabled={submitting || !partName || !partQuestionCount}
                className="px-4 py-2 bg-amber-500 text-gray-900 font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                {submitting ? "Adding..." : "Add Part"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Exam Part Modal */}
      {showEditPartModal && selectedPart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Edit Exam Part</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Part Name</label>
                <input
                  type="text"
                  value={editPartName}
                  onChange={(e) => setEditPartName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chapter Start</label>
                  <input
                    type="number"
                    value={editPartChapterStart}
                    onChange={(e) => setEditPartChapterStart(e.target.value)}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chapter End</label>
                  <input
                    type="number"
                    value={editPartChapterEnd}
                    onChange={(e) => setEditPartChapterEnd(e.target.value)}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">No. of Questions</label>
                <input
                  type="number"
                  value={editPartQuestionCount}
                  onChange={(e) => setEditPartQuestionCount(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passing Score (%)</label>
                <input
                  type="number"
                  value={editPartPassingScore}
                  onChange={(e) => setEditPartPassingScore(e.target.value)}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowEditPartModal(false);
                  setSelectedPart(null);
                  setEditPartName("");
                  setEditPartChapterStart("");
                  setEditPartChapterEnd("");
                  setEditPartQuestionCount("");
                  setEditPartPassingScore("70");
                }}
                disabled={submitting}
                className="px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePart}
                disabled={submitting || !editPartName || !editPartQuestionCount}
                className="px-4 py-2 bg-amber-500 text-gray-900 font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
