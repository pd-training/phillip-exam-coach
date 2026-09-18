"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

interface Paper {
  id: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
}

interface Assignment {
  id: string;
  paperId: string;
  paper: Paper;
  status: string;
}

interface Attempt {
  id: string;
  paperId: string;
  paper: Paper;
  status: string;
  overallScore: number | null;
  passed: boolean | null;
  startTime: string;
}

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // For now, just show empty state
        // Real implementation would fetch from API
        setAssignments([]);
        setAttempts([]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1>📚 Student Dashboard</h1>
      <p>Welcome, {session?.user?.name || "Student"}!</p>

      {/* Assigned Papers */}
      <section style={{ marginTop: "30px" }}>
        <h2>📋 Assigned Papers</h2>
        {loading ? (
          <p>Loading...</p>
        ) : assignments.length === 0 ? (
          <p>No papers assigned yet. Ask your admin to assign an exam.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                style={{
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <h3>{assignment.paper.title}</h3>
                <p>Duration: {assignment.paper.durationMinutes} minutes</p>
                <p>Questions: {assignment.paper.totalQuestions}</p>
                <button style={{ padding: "10px 20px", backgroundColor: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                  Start Exam
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Attempts */}
      <section style={{ marginTop: "30px" }}>
        <h2>📊 Recent Attempts</h2>
        {attempts.length === 0 ? (
          <p>No attempts yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Exam</th>
                <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Score</th>
                <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "10px" }}>{attempt.paper.title}</td>
                  <td style={{ padding: "10px" }}>{attempt.overallScore ? `${attempt.overallScore.toFixed(1)}%` : "N/A"}</td>
                  <td style={{ padding: "10px" }}>
                    <span style={{ color: attempt.passed ? "green" : "red" }}>
                      {attempt.passed ? "✅ Passed" : "❌ Failed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
