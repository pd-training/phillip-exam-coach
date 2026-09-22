"use client";

import StudentNav from "@/components/StudentNav";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Paper {
  id: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  createdAt: string;
}

interface AttemptStats {
  completedCount: number;
  averageScore: number;
  passCount: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [stats, setStats] = useState<AttemptStats>({ completedCount: 0, averageScore: 0, passCount: 0 });
  const [loading, setLoading] = useState(true);

  // Handle auth redirects
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" || !session?.user) {
      router.push("/login");
      return;
    }

    if ((session?.user as any)?.role === "ADMIN") {
      router.push("/admin/dashboard");
      return;
    }
  }, [status, session?.user?.email, (session?.user as any)?.role]);

  if (status === "loading") {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  // Don't render until we know they're authenticated and not admin
  if (status === "unauthenticated" || !session?.user || (session?.user as any)?.role === "ADMIN") {
    return null;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [papersRes, attemptsRes] = await Promise.all([
          fetch("/api/papers"),
          fetch("/api/student/attempts")
        ]);

        if (papersRes.ok) {
          const data = await papersRes.json();
          setPapers(data.papers || []);
        }

        if (attemptsRes.ok) {
          const data = await attemptsRes.json();
          setStats(data.stats || { completedCount: 0, averageScore: 0, passCount: 0 });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <StudentNav />

      {/* Main Content */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "600", margin: "0 0 8px 0", color: "#1f2937" }}>
            Welcome, {session?.user?.name || "Student"}
          </h1>
          <p style={{ color: "#666", margin: "0", fontSize: "14px" }}>Your assigned CMFAS papers</p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "40px" }}>
          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#3b82f6", marginBottom: "8px" }}>{stats.completedCount}</div>
            <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>Full Exam Attempts Completed</p>
          </div>
          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: stats.completedCount > 0 ? "#10b981" : "#999", marginBottom: "8px" }}>{stats.completedCount > 0 ? `${stats.averageScore}%` : "—"}</div>
            <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>Average score</p>
          </div>
          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: stats.completedCount > 0 ? "#10b981" : "#999", marginBottom: "8px" }}>
              {stats.completedCount > 0 ? `${Math.round((stats.passCount / stats.completedCount) * 100)}%` : "—"}
            </div>
            <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>Pass rate ({stats.passCount} of {stats.completedCount})</p>
          </div>
        </div>

        {/* AI Recommended Chapters */}
        <div style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          marginBottom: "40px",
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "20px", marginRight: "8px" }}>✨</span>
            <h2 style={{ margin: "0", fontSize: "18px", fontWeight: "600" }}>AI Recommended Chapters to Practice</h2>
          </div>
          <p style={{ color: "#666", fontSize: "13px", margin: "0 0 20px 0" }}>
            Based on your results across every paper and practice session
          </p>
          
          {loading ? (
            <p style={{ color: "#666" }}>Loading...</p>
          ) : (
            <div>
              {papers.length === 0 ? (
                <p style={{ color: "#666", fontSize: "14px", margin: "0" }}>
                  Take your first exam to get AI recommendations
                </p>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {[
                    { num: 1, chapter: "RES5 - Chapter 15", score: "0%" },
                    { num: 2, chapter: "RES5 - Chapter 21", score: "0%" },
                    { num: 3, chapter: "RES5 - Chapter 11", score: "0%" },
                  ].map((item) => (
                    <div key={item.num} style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "16px",
                      backgroundColor: "#f9f9f9",
                      borderRadius: "6px",
                      justifyContent: "space-between",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: "#e5e7eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "600",
                          color: "#666",
                        }}>
                          {item.num}
                        </div>
                        <div>
                          <p style={{ margin: "0", fontWeight: "500", fontSize: "14px" }}>{item.chapter}</p>
                          <p style={{ margin: "4px 0 0 0", color: "#ef4444", fontSize: "12px", fontWeight: "600" }}>0% correct</p>
                        </div>
                      </div>
                      <span style={{ color: "#999", fontSize: "20px" }}>→</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Your Papers */}
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 20px 0" }}>Your papers</h2>
          {loading ? (
            <p style={{ color: "#666" }}>Loading papers...</p>
          ) : papers.length === 0 ? (
            <div style={{
              backgroundColor: "white",
              padding: "40px",
              borderRadius: "8px",
              textAlign: "center",
              color: "#666",
            }}>
              <p style={{ margin: "0" }}>No exam papers available yet.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {papers.map((paper) => (
                <a
                  key={paper.id}
                  href={`/exam/${paper.id}`}
                  style={{
                    textDecoration: "none",
                    backgroundColor: "white",
                    padding: "20px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "600", color: "#3b82f6" }}>
                      {paper.title}
                    </h3>
                    <p style={{ margin: "4px 0 0 0", color: "#666", fontSize: "13px" }}>
                      {paper.totalQuestions} questions — {paper.durationMinutes} min
                    </p>
                  </div>
                  <span style={{ color: "#999", fontSize: "18px" }}>→</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
