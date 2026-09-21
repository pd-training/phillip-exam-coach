"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface PaperInfo {
  id: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
}

export default function PracticePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const params = useParams();
  const paperId = params.paperId as string;

  const [paper, setPaper] = useState<PaperInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle auth redirects
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
  }, [status, router]);

  useEffect(() => {
    if (!paperId) return;
    fetchPaper();
  }, [paperId]);

  const fetchPaper = async () => {
    try {
      const res = await fetch(`/api/papers/${paperId}`);
      if (res.ok) {
        const data = await res.json();
        setPaper(data.paper);
      }
    } catch (error) {
      console.error("Failed to fetch paper:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (!paper) {
    return <div style={{ padding: "20px" }}>Paper not found</div>;
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: "30px" }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: "8px 16px",
            backgroundColor: "transparent",
            color: "#3b82f6",
            border: "none",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          ← Back to papers
        </button>
      </div>

      <h1 style={{ marginBottom: "10px" }}>{paper.title}</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        {paper.totalQuestions} questions • {paper.durationMinutes} minutes
      </p>

      <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {/* Full Exam Mode */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f0f9ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onClick={() => router.push(`/exam/${paperId}/full-exam`)}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#e0f2fe";
            e.currentTarget.style.borderColor = "#7dd3fc";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#f0f9ff";
            e.currentTarget.style.borderColor = "#bfdbfe";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>📖</div>
          <h3 style={{ margin: "0 0 8px 0" }}>Full Exam Mode</h3>
          <p style={{ margin: "0 0 12px 0", color: "#666", fontSize: "14px" }}>
            Complete full exam following the exam configuration with timer. Get feedback after submitting all answers.
          </p>
          <ul style={{ margin: "12px 0 0 0", paddingLeft: "20px", color: "#666", fontSize: "13px" }}>
            <li>Timer: {paper.durationMinutes} minutes</li>
            <li>All questions at once</li>
            <li>Feedback after submission</li>
          </ul>
        </div>

        {/* Quick Quiz Mode */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#fef3c7",
            border: "1px solid #fde68a",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onClick={() => router.push(`/exam/${paperId}/quick-quiz`)}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#fef08a";
            e.currentTarget.style.borderColor = "#fcd34d";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#fef3c7";
            e.currentTarget.style.borderColor = "#fde68a";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚡</div>
          <h3 style={{ margin: "0 0 8px 0" }}>Quick Quiz</h3>
          <p style={{ margin: "0 0 12px 0", color: "#666", fontSize: "14px" }}>
            15 random questions with immediate feedback after each question.
          </p>
          <ul style={{ margin: "12px 0 0 0", paddingLeft: "20px", color: "#666", fontSize: "13px" }}>
            <li>15 random questions</li>
            <li>Immediate feedback</li>
            <li>Perfect for quick review</li>
          </ul>
        </div>

        {/* Practice by Chapter Mode */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onClick={() => router.push(`/exam/${paperId}/practice-chapter`)}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#ecfdf5";
            e.currentTarget.style.borderColor = "#86efac";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#f0fdf4";
            e.currentTarget.style.borderColor = "#bbf7d0";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>📚</div>
          <h3 style={{ margin: "0 0 8px 0" }}>Practice by Chapter</h3>
          <p style={{ margin: "0 0 12px 0", color: "#666", fontSize: "14px" }}>
            Select a chapter and drill through all questions with immediate feedback.
          </p>
          <ul style={{ margin: "12px 0 0 0", paddingLeft: "20px", color: "#666", fontSize: "13px" }}>
            <li>Choose chapter to focus</li>
            <li>Immediate feedback</li>
            <li>Build mastery by topic</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
