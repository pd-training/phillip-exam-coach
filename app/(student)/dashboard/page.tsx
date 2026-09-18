"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

interface Paper {
  id: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  createdAt: string;
}

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  if (status === "loading") {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (status === "unauthenticated") {
    redirect("/login");
  }

  if (!session?.user) {
    redirect("/login");
  }

  // Redirect admin users to admin dashboard
  if ((session.user as any).role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/papers");
        if (res.ok) {
          const data = await res.json();
          setPapers(data.papers || []);
        }
      } catch (error) {
        console.error("Error fetching papers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ margin: "0 0 8px 0" }}>📚 Student Dashboard</h1>
        <p style={{ color: "#666", margin: "0" }}>Welcome, {session?.user?.name || "Student"}!</p>
      </div>

      {/* Available Exams Section */}
      <section style={{ marginTop: "30px" }}>
        <h2 style={{ marginBottom: "20px" }}>📋 Available Exams</h2>
        
        {loading ? (
          <p style={{ color: "#666" }}>Loading exams...</p>
        ) : papers.length === 0 ? (
          <div style={{
            backgroundColor: "#f3f4f6",
            padding: "40px",
            borderRadius: "12px",
            textAlign: "center",
            color: "#666",
          }}>
            <p style={{ margin: "0" }}>No exams available yet. Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {papers.map((paper) => (
              <div
                key={paper.id}
                style={{
                  backgroundColor: "white",
                  padding: "24px",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "600" }}>
                  {paper.title}
                </h3>
                
                <div style={{ 
                  margin: "0 0 20px 0", 
                  fontSize: "14px", 
                  color: "#666",
                  flex: 1
                }}>
                  <p style={{ margin: "0 0 8px 0" }}>
                    ⏱️ Duration: <strong>{paper.durationMinutes} minutes</strong>
                  </p>
                  <p style={{ margin: "0" }}>
                    ❓ Questions: <strong>{paper.totalQuestions}</strong>
                  </p>
                </div>

                <a href={`/exam/${paper.id}`} style={{ textDecoration: "none" }}>
                  <button style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#2563eb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#3b82f6";
                  }}>
                    Start Exam →
                  </button>
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Info Section */}
      <section style={{ marginTop: "40px", padding: "20px", backgroundColor: "#f0fdf4", borderLeft: "4px solid #10b981", borderRadius: "8px" }}>
        <h3 style={{ margin: "0 0 10px 0", color: "#065f46" }}>💡 Tips</h3>
        <ul style={{ margin: "0", paddingLeft: "20px", color: "#065f46" }}>
          <li>Manage your time wisely during the exam</li>
          <li>You can navigate between questions using the quick navigation panel</li>
          <li>Your answers are automatically saved as you progress</li>
          <li>You need 70% to pass</li>
        </ul>
      </section>
    </div>
  );
}
