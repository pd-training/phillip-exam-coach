"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminNav } from "@/app/components/AdminNav";

interface StatCard {
  label: string;
  value: string | number;
  color: string;
}

interface MissedQuestion {
  question: string;
  missCount: number;
}

interface Attempt {
  student: string;
  paper: string;
  score: number;
  result: "Pass" | "Fail";
  submitted: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [missedQuestions, setMissedQuestions] = useState<MissedQuestion[]>([
    { question: "False trading and market rigging transactions are prohibited under which section of the SFA?", missCount: 4 },
    { question: "Which notice sets out the minimum academic qualification and examination requirements referenced within FAA-G01's assessment of representatives?", missCount: 3 },
    { question: "FSG-G02 sets standards of conduct for:", missCount: 3 },
    { question: "Under MAS 307, a specified single premium ILP requires monthly Statements to Policyholders where the death and critical illness benefit is:", missCount: 3 },
    { question: "Which MAS guideline, as referenced in the Study Text's Fair Dealing chapter, sets out five fair dealing outcomes for financial institutions?", missCount: 3 },
  ]);
  const [attempts, setAttempts] = useState<Attempt[]>([
    { student: "Daryl Yeo", paper: "RES5", score: 42.0, result: "Fail", submitted: "7 Sept 2026, 6:46 pm" },
    { student: "Sample Student", paper: "RES5", score: 99.3, result: "Pass", submitted: "26 Aug 2026, 9:04 pm" },
    { student: "Sample Student", paper: "RES5", score: 99.3, result: "Pass", submitted: "26 Aug 2026, 3:56 pm" },
  ]);

  // Auth check
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (!session?.user) {
      router.push("/login");
      return;
    }
    if ((session?.user as any)?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
  }, [status, session, router]);

  // Initialize stats
  useEffect(() => {
    setStats([
      { label: "Total users", value: 9, color: "#3b82f6" },
      { label: "Active users", value: 9, color: "#10b981" },
      { label: "Attempts today", value: 0, color: "#f59e0b" },
      { label: "Average score", value: "51.7%", color: "#8b5cf6" },
      { label: "Pass rate", value: "47%", color: "#ef4444" },
    ]);
  }, []);

  if (status === "loading") {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (status === "unauthenticated" || !session?.user || (session?.user as any)?.role !== "ADMIN") {
    return null;
  }

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <AdminNav title="📊 Admin Dashboard" subtitle="Overview of exam attempts and performance metrics" />

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "30px 20px" }}>
        {/* Stats Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "16px",
          marginBottom: "40px",
        }}>
          {stats.map((stat, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "20px",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: stat.color,
                marginBottom: "8px",
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: "12px",
                color: "#6b7280",
                fontWeight: "500",
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Most Missed Questions */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          padding: "24px",
          marginBottom: "30px",
        }}>
          <h2 style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#1f2937",
            margin: "0 0 20px 0",
          }}>
            Most missed questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {missedQuestions.map((q, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  paddingBottom: "16px",
                  borderBottom: idx !== missedQuestions.length - 1 ? "1px solid #e5e7eb" : "none",
                }}
              >
                <p style={{
                  margin: "0",
                  fontSize: "14px",
                  color: "#374151",
                  flex: 1,
                  lineHeight: "1.5",
                }}>
                  {q.question}
                </p>
                <span style={{
                  display: "inline-block",
                  marginLeft: "16px",
                  padding: "4px 12px",
                  backgroundColor: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                }}>
                  missed {q.missCount}×
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Attempts */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          padding: "24px",
        }}>
          <h2 style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#1f2937",
            margin: "0 0 20px 0",
          }}>
            Recent attempts
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ textAlign: "left", padding: "12px 0", color: "#6b7280", fontWeight: "600" }}>STUDENT</th>
                  <th style={{ textAlign: "left", padding: "12px 0", color: "#6b7280", fontWeight: "600" }}>PAPER</th>
                  <th style={{ textAlign: "left", padding: "12px 0", color: "#6b7280", fontWeight: "600" }}>SCORE</th>
                  <th style={{ textAlign: "left", padding: "12px 0", color: "#6b7280", fontWeight: "600" }}>RESULT</th>
                  <th style={{ textAlign: "left", padding: "12px 0", color: "#6b7280", fontWeight: "600" }}>SUBMITTED</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((att, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px 0", color: "#1f2937" }}>{att.student}</td>
                    <td style={{ padding: "12px 0", color: "#3b82f6", fontWeight: "500" }}>{att.paper}</td>
                    <td style={{ padding: "12px 0", color: "#1f2937" }}>{att.score}%</td>
                    <td style={{ padding: "12px 0" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                        backgroundColor: att.result === "Pass" ? "#d1fae5" : "#fee2e2",
                        color: att.result === "Pass" ? "#065f46" : "#991b1b",
                      }}>
                        {att.result}
                      </span>
                    </td>
                    <td style={{ padding: "12px 0", color: "#6b7280" }}>{att.submitted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
