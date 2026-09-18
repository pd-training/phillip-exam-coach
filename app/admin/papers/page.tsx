"use client";

import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";

interface Paper {
  id: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  createdAt: string;
}

export default function PaperManagement() {
  const { data: session, status } = useSession();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("180");
  const [questions, setQuestions] = useState("150");
  const [submitting, setSubmitting] = useState(false);

  if (status === "loading") {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (status === "unauthenticated") {
    redirect("/login");
  }

  if ((session?.user as any)?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  useEffect(() => {
    fetchPapers();
  }, []);

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
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  const handleCreatePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          durationMinutes: parseInt(duration),
          totalQuestions: parseInt(questions),
        }),
      });

      if (res.ok) {
        setTitle("");
        setDuration("180");
        setQuestions("150");
        setShowForm(false);
        await fetchPapers();
      }
    } catch (error) {
      console.error("Failed to create paper:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ margin: "0 0 8px 0" }}>📝 Paper Management</h1>
          <p style={{ color: "#666", margin: "0" }}>Create and manage exam papers</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <a href="/admin/dashboard">
            <button style={{
              padding: "10px 20px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}>
              ← Back
            </button>
          </a>
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* New Paper Button */}
      <div style={{ marginBottom: "30px" }}>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#1f2937",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          {showForm ? "✕ Cancel" : "+ New Paper"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          marginBottom: "30px",
        }}>
          <h3 style={{ marginTop: "0", marginBottom: "20px" }}>Create New Exam Paper</h3>
          <form onSubmit={handleCreatePaper}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
                  Paper Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
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
                  Total Questions
                </label>
                <input
                  type="number"
                  value={questions}
                  onChange={(e) => setQuestions(e.target.value)}
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
          </form>
        </div>
      )}

      {/* Papers List */}
      <div>
        {loading ? (
          <p style={{ color: "#666" }}>Loading papers...</p>
        ) : papers.length === 0 ? (
          <div style={{
            backgroundColor: "#f3f4f6",
            padding: "40px",
            borderRadius: "12px",
            textAlign: "center",
            color: "#666",
          }}>
            <p style={{ margin: "0" }}>No exam papers created yet. Click "New Paper" to get started.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {papers.map((paper) => (
              <div
                key={paper.id}
                style={{
                  backgroundColor: "white",
                  padding: "20px",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>{paper.title}</h3>
                  <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>
                    ⏱️ {paper.durationMinutes} min • ❓ {paper.totalQuestions} questions
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button style={{
                    padding: "8px 16px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}>
                    Edit
                  </button>
                  <button style={{
                    padding: "8px 16px",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
