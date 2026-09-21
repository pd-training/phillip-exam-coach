"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Paper {
  id: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  isAvailable: boolean;
  createdAt: string;
}

interface Question {
  id: string;
  paperId: string;
  module: string;
  questionPool: number;
  requiredCount: number;
  drawType: "random" | "fixed";
}

interface Chapter {
  id: string;
  paperId: string;
  name: string;
  description?: string;
  orderIndex: number;
}

interface ExamFormat {
  paperId: string;
  passingScore: number;
  timeWarning: number; // minutes
  showAnswerReview: boolean;
  allowRetakes: boolean;
  retakeLimit?: number;
}

type ActiveTab = "availability" | "questions" | "settings";
type ActiveModal = null | "createPaper" | "editPaper" | "editQuestion" | "manageChapters" | "examFormat";

export default function PapersManagement() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [examFormats, setExamFormats] = useState<Record<string, ExamFormat>>({});
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>("availability");
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedPaperId, setSelectedPaperId] = useState<string>("");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Form states
  const [paperTitle, setPaperTitle] = useState("");
  const [paperDuration, setPaperDuration] = useState("180");
  const [paperTotalQuestions, setPaperTotalQuestions] = useState("150");
  const [submitting, setSubmitting] = useState(false);

  // Question form states
  const [qModule, setQModule] = useState("");
  const [qPool, setQPool] = useState("100");
  const [qRequired, setQRequired] = useState("50");
  const [qDrawType, setQDrawType] = useState<"random" | "fixed">("random");

  // Chapter form states
  const [chapterName, setChapterName] = useState("");
  const [chapterDesc, setChapterDesc] = useState("");

  // Exam format states
  const [passingScore, setPassingScore] = useState("60");
  const [timeWarning, setTimeWarning] = useState("5");
  const [showAnswerReview, setShowAnswerReview] = useState(true);
  const [allowRetakes, setAllowRetakes] = useState(true);
  const [retakeLimit, setRetakeLimit] = useState("3");

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
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPapers();
    }
  }, [status]);

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

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      window.location.href = `${window.location.origin}/login`;
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = `${window.location.origin}/login`;
    }
  };

  const openCreatePaper = () => {
    setPaperTitle("");
    setPaperDuration("180");
    setPaperTotalQuestions("150");
    setActiveModal("createPaper");
  };

  const handleCreatePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paperTitle.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: paperTitle,
          durationMinutes: parseInt(paperDuration),
          totalQuestions: parseInt(paperTotalQuestions),
        }),
      });

      if (res.ok) {
        await fetchPapers();
        setActiveModal(null);
      }
    } catch (error) {
      console.error("Failed to create paper:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const togglePaperAvailability = async (paperId: string, currentStatus: boolean) => {
    setTogglingId(paperId);
    try {
      const res = await fetch(`/api/papers/${paperId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setPapers(papers.map(p => p.id === paperId ? { ...p, isAvailable: !currentStatus } : p));
      } else {
        console.error("Failed to toggle:", res.statusText);
      }
    } catch (error) {
      console.error("Failed to toggle availability:", error);
    } finally {
      setTogglingId(null);
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
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "transparent",
              color: "#3b82f6",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Log out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "30px 20px" }}>
        {/* Page Header */}
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "28px" }}>📚 Papers & Questions</h1>
          <p style={{ color: "#666", margin: "0", fontSize: "14px" }}>Manage exam papers, questions, chapters & settings</p>
        </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "2px solid #e5e7eb", paddingBottom: "0" }}>
        {(["availability", "questions", "settings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 20px",
              backgroundColor: activeTab === tab ? "#3b82f6" : "transparent",
              color: activeTab === tab ? "white" : "#6b7280",
              border: "none",
              borderBottom: activeTab === tab ? "3px solid #3b82f6" : "none",
              borderRadius: "0",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {tab === "availability" && "📋 Paper Availability"}
            {tab === "questions" && "❓ Question Bank"}
            {tab === "settings" && "⚙️ Exam Format"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "availability" && (
        <div>
          {/* New Paper Button */}
          <div style={{ marginBottom: "24px" }}>
            <button
              onClick={openCreatePaper}
              style={{
                padding: "12px 24px",
                backgroundColor: "#1f2937",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              + Create New Paper
            </button>
          </div>

          {/* Paper Availability */}
          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}>
            <h3 style={{ marginTop: "0", marginBottom: "8px" }}>Paper Availability</h3>
            <p style={{ color: "#666", fontSize: "13px", marginBottom: "20px" }}>
              Turning a paper off hides it everywhere for students — Browse Papers, Dashboard, and Practice — including for students already assigned to it. Existing exam attempts and history aren't affected, only the ability to start something new or continue practicing it.
            </p>

            {loading ? (
              <p style={{ color: "#666" }}>Loading papers...</p>
            ) : papers.length === 0 ? (
              <p style={{ color: "#999", fontStyle: "italic" }}>No papers created yet. Click "Create New Paper" to get started.</p>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {papers.map((paper) => (
                  <div
                    key={paper.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      alignItems: "center",
                      padding: "16px",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    <div>
                      <p style={{ margin: "0", fontWeight: "600", fontSize: "14px" }}>{paper.title}</p>
                      <p style={{ margin: "4px 0 0 0", color: "#666", fontSize: "12px" }}>
                        {paper.durationMinutes} min • {paper.totalQuestions} questions
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600",
                        backgroundColor: paper.isAvailable ? "#d1fae5" : "#fee2e2",
                        color: paper.isAvailable ? "#065f46" : "#991b1b",
                      }}>
                        {paper.isAvailable ? "Available" : "Unavailable"}
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
        </div>
      )}

      {activeTab === "questions" && (
        <div>
          {/* Question Bank */}
          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: "0" }}>Question Bank</h3>
              <button
                onClick={() => {
                  setSelectedQuestion(null);
                  setActiveModal("editQuestion");
                }}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                + Add Question Pool
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#4b5563" }}>Paper</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#4b5563" }}>Module</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#4b5563" }}>Question Pool</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#4b5563" }}>Draw Type</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#4b5563" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {papers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#999" }}>
                        Create papers first to add questions
                      </td>
                    </tr>
                  ) : (
                    papers.map((paper) => (
                      <tr key={paper.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "12px" }}>
                          <strong>{paper.title}</strong>
                        </td>
                        <td style={{ padding: "12px" }}>—</td>
                        <td style={{ padding: "12px" }}>{paper.totalQuestions} • Random draw active</td>
                        <td style={{ padding: "12px" }}>Random</td>
                        <td style={{ padding: "12px" }}>
                          <button style={{
                            color: "#3b82f6",
                            backgroundColor: "transparent",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                            textDecoration: "underline",
                          }}>
                            View / edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div>
          {/* Exam Format Settings */}
          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}>
            <h3 style={{ marginTop: "0", marginBottom: "20px" }}>Exam Format Settings</h3>

            {papers.length === 0 ? (
              <p style={{ color: "#999", fontStyle: "italic" }}>Create papers first to configure exam settings.</p>
            ) : (
              <div style={{ display: "grid", gap: "24px" }}>
                {papers.map((paper) => (
                  <div key={paper.id} style={{
                    padding: "20px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <h4 style={{ margin: "0", fontSize: "15px", fontWeight: "600" }}>{paper.title}</h4>
                      <button
                        onClick={() => {
                          setSelectedPaperId(paper.id);
                          setPassingScore("60");
                          setTimeWarning("5");
                          setShowAnswerReview(true);
                          setAllowRetakes(true);
                          setRetakeLimit("3");
                          setActiveModal("examFormat");
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

                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "16px",
                      fontSize: "13px",
                    }}>
                      <div>
                        <p style={{ margin: "0 0 4px 0", color: "#666", fontSize: "12px", fontWeight: "500" }}>Passing Score</p>
                        <p style={{ margin: "0", fontWeight: "600" }}>60%</p>
                      </div>
                      <div>
                        <p style={{ margin: "0 0 4px 0", color: "#666", fontSize: "12px", fontWeight: "500" }}>Time Warning</p>
                        <p style={{ margin: "0", fontWeight: "600" }}>5 minutes before end</p>
                      </div>
                      <div>
                        <p style={{ margin: "0 0 4px 0", color: "#666", fontSize: "12px", fontWeight: "500" }}>Answer Review</p>
                        <p style={{ margin: "0", fontWeight: "600" }}>✓ Enabled</p>
                      </div>
                      <div>
                        <p style={{ margin: "0 0 4px 0", color: "#666", fontSize: "12px", fontWeight: "500" }}>Retakes</p>
                        <p style={{ margin: "0", fontWeight: "600" }}>✓ Allowed (3 max)</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {activeModal === "createPaper" && (
        <Modal onClose={() => setActiveModal(null)}>
          <h2 style={{ marginTop: "0" }}>Create New Exam Paper</h2>
          <form onSubmit={handleCreatePaper}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
                Paper Title *
              </label>
              <input
                type="text"
                value={paperTitle}
                onChange={(e) => setPaperTitle(e.target.value)}
                placeholder="e.g., RES5 Mock Exam"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  boxSizing: "border-box",
                }}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={paperDuration}
                  onChange={(e) => setPaperDuration(e.target.value)}
                  min="30"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
                  Total Questions *
                </label>
                <input
                  type="number"
                  value={paperTotalQuestions}
                  onChange={(e) => setPaperTotalQuestions(e.target.value)}
                  min="1"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e5e7eb",
                  color: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "10px 24px",
                  backgroundColor: submitting ? "#9ca3af" : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Creating..." : "Create Paper"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {activeModal === "examFormat" && (
        <Modal onClose={() => setActiveModal(null)}>
          <h2 style={{ marginTop: "0" }}>Exam Format Settings</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            setActiveModal(null);
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
                  Passing Score (%) *
                </label>
                <input
                  type="number"
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                  min="0"
                  max="100"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
                  Time Warning (minutes) *
                </label>
                <input
                  type="number"
                  value={timeWarning}
                  onChange={(e) => setTimeWarning(e.target.value)}
                  min="1"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", fontSize: "14px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showAnswerReview}
                  onChange={(e) => setShowAnswerReview(e.target.checked)}
                  style={{ marginRight: "8px" }}
                />
                Show Answer Review After Exam
              </label>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", fontSize: "14px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={allowRetakes}
                  onChange={(e) => setAllowRetakes(e.target.checked)}
                  style={{ marginRight: "8px" }}
                />
                Allow Retakes
              </label>
            </div>

            {allowRetakes && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
                  Retake Limit
                </label>
                <input
                  type="number"
                  value={retakeLimit}
                  onChange={(e) => setRetakeLimit(e.target.value)}
                  min="1"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e5e7eb",
                  color: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Save Settings
              </button>
            </div>
          </form>
        </Modal>
      )}
      </div>
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
        maxWidth: "500px",
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
