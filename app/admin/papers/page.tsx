"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

// Types
interface Paper {
  id: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  isAvailable: boolean;
  totalTime: number;
  createdAt: string;
}

interface Question {
  id: string;
  paperId: string;
  chapterNumber: number;
  questionText: string;
  correctAnswer: string;
  explanation: string;
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

type ActiveTab = "availability" | "questions" | "format";
type ActiveModal = null | "uploadQuestions" | "viewQuestions" | "editQuestion" | "configureFormat" | "createPaper";

export default function PapersManagement() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Page state
  const [activeTab, setActiveTab] = useState<ActiveTab>("availability");
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Data
  const [papers, setPapers] = useState<Paper[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examParts, setExamParts] = useState<ExamPart[]>([]);

  // Upload form
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");

  // Question edit form
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editAnswer, setEditAnswer] = useState("A");
  const [editChapter, setEditChapter] = useState("1");
  const [editExplanation, setEditExplanation] = useState("");

  // Exam format form
  const [totalTime, setTotalTime] = useState("120");
  const [parts, setParts] = useState<Omit<ExamPart, "id" | "createdAt" | "updatedAt">[]>([]);
  const [newPart, setNewPart] = useState({
    partName: "",
    chapterStart: 1,
    chapterEnd: 13,
    questionCount: 110,
    passingScore: 75,
  });

  // Create paper form
  const [newPaperTitle, setNewPaperTitle] = useState("");
  const [newPaperDuration, setNewPaperDuration] = useState("120");
  const [newPaperQuestions, setNewPaperQuestions] = useState("50");

  // Auth check
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (!session?.user || (session?.user as any)?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchPapers();
  }, [status, session, router]);

  // Fetch papers
  const fetchPapers = async () => {
    try {
      const res = await fetch("/api/papers");
      if (res.ok) {
        const data = await res.json();
        setPapers(data.papers || []);
      }
    } catch (error) {
      console.error("Failed to fetch papers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch questions for selected paper
  const fetchQuestions = async (paperId: string) => {
    try {
      const res = await fetch(`/api/papers/${paperId}/questions`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    }
  };

  // Fetch exam format for selected paper
  const fetchExamFormat = async (paperId: string) => {
    try {
      const res = await fetch(`/api/papers/${paperId}/exam-format`);
      if (res.ok) {
        const data = await res.json();
        setTotalTime(String(data.examFormat?.totalTime || 120));
        setParts(data.examFormat?.parts || []);
      }
    } catch (error) {
      console.error("Failed to fetch exam format:", error);
    }
  };

  // Toggle paper availability
  const togglePaperAvailability = async (paperId: string, currentStatus: boolean) => {
    setTogglingId(paperId);
    try {
      const res = await fetch(`/api/papers/${paperId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });

      if (res.ok) {
        await fetchPapers();
      } else {
        console.error("Toggle failed");
      }
    } catch (error) {
      console.error("Toggle error:", error);
    } finally {
      setTogglingId(null);
    }
  };

  // Upload questions
  const handleUploadQuestions = async () => {
    if (!uploadFile || !selectedPaperId) return;

    setSubmitting(true);
    setUploadProgress("Uploading...");

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const res = await fetch(`/api/papers/${selectedPaperId}/questions/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setUploadProgress(`✅ ${data.count} questions imported successfully!`);
        await fetchPapers();
        await fetchQuestions(selectedPaperId);
        setTimeout(() => {
          setActiveModal(null);
          setUploadFile(null);
          setUploadProgress("");
        }, 2000);
      } else {
        setUploadProgress(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setUploadProgress(`❌ Upload failed: ${String(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Update question
  const handleUpdateQuestion = async () => {
    if (!selectedQuestion || !selectedPaperId) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/papers/${selectedPaperId}/questions/${selectedQuestion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: editQuestionText,
          correctAnswer: editAnswer,
          chapterNumber: parseInt(editChapter),
          explanation: editExplanation,
        }),
      });

      if (res.ok) {
        await fetchQuestions(selectedPaperId);
        setActiveModal(null);
        setSelectedQuestion(null);
      }
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedPaperId || !confirm("Delete this question?")) return;

    try {
      const res = await fetch(`/api/papers/${selectedPaperId}/questions/${questionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchQuestions(selectedPaperId);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  // Save exam format
  const handleSaveExamFormat = async () => {
    if (!selectedPaperId || parts.length === 0) {
      alert("Please configure at least one part");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/papers/${selectedPaperId}/exam-format`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalTime: parseInt(totalTime),
          parts: parts.map((p, i) => ({
            partName: p.partName,
            chapterStart: p.chapterStart,
            chapterEnd: p.chapterEnd,
            questionCount: p.questionCount,
            passingScore: p.passingScore,
            orderIndex: i + 1,
          })),
        }),
      });

      if (res.ok) {
        alert("Exam format saved successfully!");
        setActiveModal(null);
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Add part
  const addPart = () => {
    setParts([...parts, { ...newPart, orderIndex: parts.length + 1 }]);
    setNewPart({
      partName: "",
      chapterStart: 1,
      chapterEnd: 13,
      questionCount: 110,
      passingScore: 75,
    });
  };

  // Remove part
  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  // Create paper
  const handleCreatePaper = async () => {
    if (!newPaperTitle.trim()) {
      alert("Paper title is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPaperTitle,
          durationMinutes: parseInt(newPaperDuration),
          totalQuestions: parseInt(newPaperQuestions),
        }),
      });

      if (res.ok) {
        await fetchPapers();
        setActiveModal(null);
        setNewPaperTitle("");
        setNewPaperDuration("120");
        setNewPaperQuestions("50");
        alert("Paper created successfully!");
      }
    } catch (error) {
      console.error("Create paper error:", error);
      alert("Failed to create paper");
    } finally {
      setSubmitting(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      window.location.href = `${window.location.origin}/login`;
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = `${window.location.origin}/login`;
    }
  };

  if (status === "loading") {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (status === "unauthenticated" || !session?.user || (session?.user as any)?.role !== "ADMIN") {
    return null;
  }

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Navigation Bar */}
      <nav style={{
        backgroundColor: "white",
        borderBottom: "1px solid #e5e7eb",
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", gap: "32px" }}>
          <a href="/admin/dashboard" style={{ textDecoration: "none", color: "#666", fontWeight: "500", fontSize: "14px" }}>
            Dashboard
          </a>
          <a href="/admin/papers" style={{ textDecoration: "none", color: "#3b82f6", fontWeight: "600", fontSize: "14px" }}>
            Papers
          </a>
          <a href="/admin/users" style={{ textDecoration: "none", color: "#666", fontWeight: "500", fontSize: "14px" }}>
            Users
          </a>
          <a href="/admin/questions" style={{ textDecoration: "none", color: "#666", fontWeight: "500", fontSize: "14px" }}>
            Questions
          </a>
        </div>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <a href="/account" style={{ color: "#666", fontSize: "14px", textDecoration: "none", cursor: "pointer" }}>
            Account
          </a>
          <span style={{ fontWeight: "600", fontSize: "14px" }}>{session?.user?.name || "Admin"}</span>
          <button onClick={handleLogout} style={{ backgroundColor: "transparent", color: "#3b82f6", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
            Log out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "30px 20px" }}>
        {/* Page Header */}
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "28px" }}>📚 Papers & Questions</h1>
          <p style={{ color: "#666", margin: "0", fontSize: "14px" }}>Manage exam papers, questions, and exam format</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "30px", borderBottom: "2px solid #e5e7eb" }}>
          {(["availability", "questions", "format"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "12px 20px",
                backgroundColor: activeTab === tab ? "#3b82f6" : "transparent",
                color: activeTab === tab ? "white" : "#666",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: activeTab === tab ? "600" : "500",
                borderRadius: "4px 4px 0 0",
              }}
            >
              {tab === "availability" && "📋 Paper Availability"}
              {tab === "questions" && "❓ Question Bank"}
              {tab === "format" && "⚙️ Exam Format"}
            </button>
          ))}
        </div>

        {/* TAB 1: Paper Availability */}
        {activeTab === "availability" && (
          <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: "0" }}>Paper Availability</h3>
              <button
                onClick={() => setActiveModal("createPaper")}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                ➕ Create New Paper
              </button>
            </div>
            <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px" }}>
              Toggle papers on/off to control student access. Existing exam attempts are not affected.
            </p>

            {papers.length === 0 ? (
              <p style={{ color: "#999" }}>No papers created yet.</p>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {papers.map((paper) => (
                  <div
                    key={paper.id}
                    style={{
                      padding: "16px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "15px" }}>{paper.title}</h4>
                      <p style={{ color: "#666", margin: "0", fontSize: "13px" }}>
                        {paper.durationMinutes} min • {paper.totalQuestions} questions
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span
                        style={{
                          padding: "6px 12px",
                          backgroundColor: paper.isAvailable ? "#d1fae5" : "#fee2e2",
                          color: paper.isAvailable ? "#065f46" : "#991b1b",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        {paper.isAvailable ? "✓ Available" : "✕ Unavailable"}
                      </span>
                      <button
                        onClick={() => togglePaperAvailability(paper.id, paper.isAvailable)}
                        disabled={togglingId === paper.id}
                        style={{
                          padding: "6px 16px",
                          backgroundColor: togglingId === paper.id ? "#d1d5db" : (paper.isAvailable ? "#fee2e2" : "#d1fae5"),
                          color: togglingId === paper.id ? "#6b7280" : (paper.isAvailable ? "#991b1b" : "#065f46"),
                          border: `1px solid ${togglingId === paper.id ? "#9ca3af" : (paper.isAvailable ? "#fca5a5" : "#86efac")}`,
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: togglingId === paper.id ? "not-allowed" : "pointer",
                          opacity: togglingId === paper.id ? 0.6 : 1,
                        }}
                      >
                        {togglingId === paper.id ? "Updating..." : (paper.isAvailable ? "Turn off" : "Turn on")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Question Bank */}
        {activeTab === "questions" && (
          <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: "0" }}>Question Bank</h3>
              <button
                onClick={() => {
                  setSelectedPaperId("");
                  setActiveModal("uploadQuestions");
                }}
                disabled={papers.length === 0}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: papers.length === 0 ? "not-allowed" : "pointer",
                  opacity: papers.length === 0 ? 0.5 : 1,
                }}
              >
                ⬆️ Upload Questions
              </button>
            </div>

            {papers.length === 0 ? (
              <p style={{ color: "#999" }}>Create papers first to upload questions.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#4b5563" }}>Paper</th>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#4b5563" }}>Total Questions</th>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#4b5563" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {papers.map((paper) => (
                      <tr key={paper.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "12px" }}>
                          <strong>{paper.title}</strong>
                        </td>
                        <td style={{ padding: "12px" }}>{paper.totalQuestions}</td>
                        <td style={{ padding: "12px" }}>
                          <button
                            onClick={() => {
                              setSelectedPaperId(paper.id);
                              setActiveModal("viewQuestions");
                              fetchQuestions(paper.id);
                            }}
                            style={{
                              color: "#3b82f6",
                              backgroundColor: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "600",
                              textDecoration: "underline",
                            }}
                          >
                            📋 View / Edit
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

        {/* TAB 3: Exam Format */}
        {activeTab === "format" && (
          <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
            <h3 style={{ marginTop: "0", marginBottom: "20px" }}>Exam Format Configuration</h3>

            {papers.length === 0 ? (
              <p style={{ color: "#999" }}>Create papers first to configure exam format.</p>
            ) : (
              <div style={{ display: "grid", gap: "24px" }}>
                {papers.map((paper) => (
                  <div
                    key={paper.id}
                    style={{
                      padding: "20px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <h4 style={{ margin: "0" }}>{paper.title}</h4>
                      <button
                        onClick={() => {
                          setSelectedPaperId(paper.id);
                          setActiveModal("configureFormat");
                          fetchExamFormat(paper.id);
                        }}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        ⚙️ Configure
                      </button>
                    </div>
                    <p style={{ margin: "0", fontSize: "13px", color: "#666" }}>
                      Total Time: {paper.totalTime} minutes
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Upload Questions */}
      {activeModal === "uploadQuestions" && (
        <Modal onClose={() => { setActiveModal(null); setUploadFile(null); setUploadProgress(""); }}>
          <h2 style={{ marginTop: "0" }}>Upload Questions</h2>
          <p style={{ color: "#666", fontSize: "13px", marginBottom: "16px" }}>
            CSV format: Chapter, Question, Answer (A-D), Explanation
          </p>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
              Select Paper *
            </label>
            <select
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "13px",
                boxSizing: "border-box",
              }}
            >
              <option value="">-- Choose a paper --</option>
              {papers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.durationMinutes} min)
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
              CSV File *
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "13px",
              }}
            />
          </div>

          {uploadProgress && (
            <div style={{ padding: "12px", backgroundColor: uploadProgress.startsWith("✅") ? "#dcfce7" : "#fee2e2", borderRadius: "6px", marginBottom: "16px", fontSize: "13px", color: uploadProgress.startsWith("✅") ? "#166534" : "#991b1b" }}>
              {uploadProgress}
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => { setActiveModal(null); setUploadFile(null); setUploadProgress(""); setSelectedPaperId(""); }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#e5e7eb",
                color: "#1f2937",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleUploadQuestions}
              disabled={!uploadFile || !selectedPaperId || submitting}
              style={{
                padding: "10px 24px",
                backgroundColor: !uploadFile || !selectedPaperId || submitting ? "#9ca3af" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: !uploadFile || !selectedPaperId || submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Uploading..." : "Upload"}
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL: View Questions */}
      {activeModal === "viewQuestions" && (
        <Modal onClose={() => { setActiveModal(null); setQuestions([]); }}>
          <h2 style={{ marginTop: "0" }}>Questions ({questions.length})</h2>

          {questions.length === 0 ? (
            <p style={{ color: "#999" }}>No questions uploaded yet. Use the "Upload Questions" button to get started.</p>
          ) : (
            <div style={{ maxHeight: "500px", overflowY: "auto", marginBottom: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e5e7eb", position: "sticky", top: "0", backgroundColor: "#f9fafb" }}>
                    <th style={{ padding: "8px", textAlign: "left", fontWeight: "600" }}>Ch</th>
                    <th style={{ padding: "8px", textAlign: "left", fontWeight: "600" }}>Question</th>
                    <th style={{ padding: "8px", textAlign: "left", fontWeight: "600" }}>Ans</th>
                    <th style={{ padding: "8px", textAlign: "left", fontWeight: "600" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px", fontWeight: "600" }}>{q.chapterNumber}</td>
                      <td style={{ padding: "8px" }}>{q.questionText.substring(0, 40)}...</td>
                      <td style={{ padding: "8px", fontWeight: "600" }}>{q.correctAnswer}</td>
                      <td style={{ padding: "8px" }}>
                        <button
                          onClick={() => {
                            setSelectedQuestion(q);
                            setEditQuestionText(q.questionText);
                            setEditAnswer(q.correctAnswer);
                            setEditChapter(String(q.chapterNumber));
                            setEditExplanation(q.explanation);
                            setActiveModal("editQuestion");
                          }}
                          style={{ color: "#3b82f6", backgroundColor: "transparent", border: "none", cursor: "pointer", fontSize: "11px", textDecoration: "underline" }}
                        >
                          Edit
                        </button>
                        {" | "}
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          style={{ color: "#ef4444", backgroundColor: "transparent", border: "none", cursor: "pointer", fontSize: "11px", textDecoration: "underline" }}
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

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setActiveModal(null); setQuestions([]); }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#e5e7eb",
                color: "#1f2937",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL: Edit Question */}
      {activeModal === "editQuestion" && selectedQuestion && (
        <Modal onClose={() => { setActiveModal("viewQuestions"); setSelectedQuestion(null); }}>
          <h2 style={{ marginTop: "0" }}>Edit Question</h2>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>Chapter *</label>
            <input
              type="number"
              value={editChapter}
              onChange={(e) => setEditChapter(e.target.value)}
              min="1"
              max="27"
              style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>Question *</label>
            <textarea
              value={editQuestionText}
              onChange={(e) => setEditQuestionText(e.target.value)}
              style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", minHeight: "80px", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>Correct Answer *</label>
            <select
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
              style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            >
              <option>A</option>
              <option>B</option>
              <option>C</option>
              <option>D</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>Explanation</label>
            <textarea
              value={editExplanation}
              onChange={(e) => setEditExplanation(e.target.value)}
              style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", minHeight: "60px", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setActiveModal("viewQuestions"); setSelectedQuestion(null); }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#e5e7eb",
                color: "#1f2937",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateQuestion}
              disabled={submitting}
              style={{
                padding: "10px 24px",
                backgroundColor: submitting ? "#9ca3af" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL: Create Paper */}
      {activeModal === "createPaper" && (
        <Modal onClose={() => { setActiveModal(null); setNewPaperTitle(""); setNewPaperDuration("120"); setNewPaperQuestions("50"); }}>
          <h2 style={{ marginTop: "0" }}>Create New Paper</h2>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
              Paper Title *
            </label>
            <input
              type="text"
              value={newPaperTitle}
              onChange={(e) => setNewPaperTitle(e.target.value)}
              placeholder="e.g., RES5, CM-LIP, HI, CM-SIP"
              style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
              Duration (minutes) *
            </label>
            <input
              type="number"
              value={newPaperDuration}
              onChange={(e) => setNewPaperDuration(e.target.value)}
              min="30"
              style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
              Total Questions (estimate) *
            </label>
            <input
              type="number"
              value={newPaperQuestions}
              onChange={(e) => setNewPaperQuestions(e.target.value)}
              min="1"
              style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setActiveModal(null); setNewPaperTitle(""); setNewPaperDuration("120"); setNewPaperQuestions("50"); }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#e5e7eb",
                color: "#1f2937",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePaper}
              disabled={submitting || !newPaperTitle.trim()}
              style={{
                padding: "10px 24px",
                backgroundColor: submitting || !newPaperTitle.trim() ? "#9ca3af" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: submitting || !newPaperTitle.trim() ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Creating..." : "Create Paper"}
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL: Configure Exam Format */}
      {activeModal === "configureFormat" && (
        <Modal onClose={() => { setActiveModal(null); setParts([]); }}>
          <h2 style={{ marginTop: "0" }}>Configure Exam Format</h2>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
              Total Time (minutes) *
            </label>
            <input
              type="number"
              value={totalTime}
              onChange={(e) => setTotalTime(e.target.value)}
              min="30"
              style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          <h4 style={{ margin: "0 0 16px 0", fontSize: "14px" }}>Exam Parts</h4>

          {parts.length > 0 && (
            <div style={{ marginBottom: "20px", display: "grid", gap: "12px" }}>
              {parts.map((part, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: "13px" }}>
                    <strong>{part.partName}</strong> | Chapters {part.chapterStart}-{part.chapterEnd} | {part.questionCount} Q | {part.passingScore}%
                  </div>
                  <button
                    onClick={() => removePart(idx)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#fee2e2",
                      color: "#991b1b",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{
            padding: "16px",
            backgroundColor: "#f0f9ff",
            borderRadius: "6px",
            border: "1px solid #bfdbfe",
            marginBottom: "16px",
            display: "grid",
            gap: "12px",
          }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "4px" }}>Part Name</label>
              <input
                type="text"
                value={newPart.partName}
                onChange={(e) => setNewPart({ ...newPart, partName: e.target.value })}
                placeholder="e.g., Part I, Part II"
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "4px" }}>Chapter Start</label>
                <input
                  type="number"
                  value={newPart.chapterStart}
                  onChange={(e) => setNewPart({ ...newPart, chapterStart: parseInt(e.target.value) })}
                  min="1"
                  style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "4px" }}>Chapter End</label>
                <input
                  type="number"
                  value={newPart.chapterEnd}
                  onChange={(e) => setNewPart({ ...newPart, chapterEnd: parseInt(e.target.value) })}
                  min="1"
                  style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "4px" }}>Questions to Draw</label>
                <input
                  type="number"
                  value={newPart.questionCount}
                  onChange={(e) => setNewPart({ ...newPart, questionCount: parseInt(e.target.value) })}
                  min="1"
                  style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "4px" }}>Passing Score (%)</label>
                <input
                  type="number"
                  value={newPart.passingScore}
                  onChange={(e) => setNewPart({ ...newPart, passingScore: parseInt(e.target.value) })}
                  min="0"
                  max="100"
                  style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <button
              onClick={addPart}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              + Add Part
            </button>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setActiveModal(null); setParts([]); }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#e5e7eb",
                color: "#1f2937",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveExamFormat}
              disabled={submitting || parts.length === 0}
              style={{
                padding: "10px 24px",
                backgroundColor: submitting || parts.length === 0 ? "#9ca3af" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: submitting || parts.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Saving..." : "Save Format"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Modal Component
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "1000",
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "32px",
        borderRadius: "12px",
        maxWidth: "600px",
        width: "90%",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            backgroundColor: "transparent",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#6b7280",
          }}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
