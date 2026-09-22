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
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* Back Link */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb", padding: "20px 0" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", paddingLeft: "20px" }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: "0",
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
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
        {/* Paper Header */}
        <div style={{ marginBottom: "40px" }}>
          <h1
            style={{
              margin: "0 0 12px 0",
              fontSize: "42px",
              fontWeight: "700",
              color: "#3b82f6",
            }}
          >
            {paper.title}
          </h1>
          <p style={{ margin: "0", fontSize: "16px", color: "#666" }}>
            Rules, Ethics and Skills for Securities Exchange Dealers
          </p>
        </div>

        {/* Full Exam Mode Card */}
        <div
          style={{
            padding: "25px",
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            marginBottom: "30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onClick={() => router.push(`/exam/${paperId}/full-exam`)}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                fontSize: "48px",
                backgroundColor: "#d1fae5",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              📄
            </div>
            <div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "600" }}>
                Full Exam Mode
              </h3>
              <p style={{ margin: "0", fontSize: "15px", color: "#666" }}>
                {paper.totalQuestions} questions — {paper.durationMinutes} min
              </p>
            </div>
          </div>

          <button
            style={{
              padding: "12px 28px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            Start exam
          </button>
        </div>

        {/* Info Banner */}
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fef3c7",
            border: "1px solid #fde68a",
            borderRadius: "8px",
            marginBottom: "40px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: "20px", marginTop: "2px" }}>⭐</span>
          <p style={{ margin: "0", fontSize: "14px", color: "#92400e", lineHeight: "1.5" }}>
            Recommended focus areas unlock after you complete at least one real mock exam on this paper.
          </p>
        </div>

        {/* Practice Modes Section */}
        <div>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "600", color: "#1f2937" }}>
            Practice modes
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
            {/* Quick Quiz Card */}
            <div
              style={{
                padding: "25px",
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={() => router.push(`/exam/${paperId}/quick-quiz`)}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚡</div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>
                Quick Quiz
              </h3>
              <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#666" }}>
                15 Questions
              </p>
              <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#1f2937", lineHeight: "1.5" }}>
                Take a focused practice session with random questions
              </p>
              <p style={{ margin: "0", fontSize: "13px", color: "#999", fontStyle: "italic" }}>
                Perfect for a quick review or when you have limited time.
              </p>
            </div>

            {/* Practice by Chapter Card */}
            <div
              style={{
                padding: "25px",
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={() => router.push(`/exam/${paperId}/practice-chapter`)}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>📚</div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>
                Practice by Chapter
              </h3>
              <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#666" }}>
                Chapter drills
              </p>
              <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#1f2937", lineHeight: "1.5" }}>
                Pick one chapter and drill questions from it
              </p>
              <p style={{ margin: "0", fontSize: "13px", color: "#999", fontStyle: "italic" }}>
                Build mastery one topic at a time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
