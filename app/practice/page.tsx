"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Paper {
  id: string;
  title: string;
  totalQuestions: number;
  durationMinutes: number;
}

export default function PracticePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchStudentPapers();
    }
  }, [status]);

  const fetchStudentPapers = async () => {
    try {
      const res = await fetch("/api/student/papers");
      if (res.ok) {
        const data = await res.json();
        setPapers(data.papers);
      }
    } catch (error) {
      console.error("Failed to fetch papers:", error);
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

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ marginBottom: "10px" }}>Practice</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        Select a paper to practice with one of three modes: Full Exam, Quick Quiz, or Practice by Chapter.
      </p>

      {papers.length === 0 ? (
        <div
          style={{
            padding: "40px",
            backgroundColor: "#f3f4f6",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#666", margin: "0" }}>
            No papers available yet. Contact your administrator to request access to papers.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {papers.map((paper) => (
            <div
              key={paper.id}
              onClick={() => router.push(`/exam/${paper.id}`)}
              style={{
                padding: "16px",
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
                e.currentTarget.style.borderColor = "#d1d5db";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600" }}>
                  {paper.title}
                </h3>
                <p style={{ margin: "0", fontSize: "13px", color: "#999" }}>
                  {paper.totalQuestions} questions • {paper.durationMinutes} minutes
                </p>
              </div>
              <div style={{ fontSize: "20px" }}>→</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
