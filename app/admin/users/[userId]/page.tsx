"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

interface AssignedPaper {
  id: string;
  title: string;
  status: string;
}

interface Attempt {
  id: string;
  paperId: string;
  paperTitle: string;
  status: string;
  score: number | null;
  result: string | null;
  timeTaken: number | null;
  submittedAt: string | null;
  createdAt: string;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const { data: session, status } = useSession();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStudent, setIsStudent] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [papers, setPapers] = useState<AssignedPaper[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [message, setMessage] = useState("");

  // Auth & redirect
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session?.user || (session?.user as any)?.role !== "ADMIN") {
      router.push("/login");
    }
  }, [status, session, router]);

  // Fetch user, papers, and attempts
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        // Fetch user
        const userRes = await fetch(`/api/users/${userId}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
          setIsStudent(userData.user.role === "STUDENT" || userData.user.role === "BOTH");
          setIsAdmin(userData.user.role === "ADMIN" || userData.user.role === "BOTH");
        }

        // Fetch papers
        const papersRes = await fetch(`/api/users/${userId}/papers`);
        if (papersRes.ok) {
          const papersData = await papersRes.json();
          setPapers(papersData.papers || []);
        }

        // Fetch attempts
        const attemptsRes = await fetch(`/api/users/${userId}/attempts`);
        if (attemptsRes.ok) {
          const attemptsData = await attemptsRes.json();
          setAttempts(attemptsData.attempts || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = '/login';
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#666" }}>Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (status === "unauthenticated" || !session?.user || (session?.user as any)?.role !== "ADMIN") {
    return null;
  }

  // User not found
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#ef4444" }}>User not found</div>
      </div>
    );
  }

  const isAdminCreated = false; // Would come from user.createdBy or similar
  const paperCount = papers.length;
  const attemptCount = attempts.length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      {/* Header */}
      <div style={{
        backgroundColor: "white",
        borderBottom: "1px solid #e5e7eb",
        padding: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <Link href="/admin/users">
          <a style={{ color: "#3b82f6", fontSize: "14px", textDecoration: "none", fontWeight: "500" }}>
            ← Back to users
          </a>
        </Link>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "transparent",
            color: "#2563eb",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          🚪 Log out
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
        {/* User Header */}
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1f2937", margin: "0 0 8px 0" }}>
            {user.name || "—"}
          </h1>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 12px 0" }}>
            {user.email}
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <span style={{
              display: "inline-block",
              padding: "4px 12px",
              backgroundColor: "#e0e7ff",
              color: "#3730a3",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "600",
            }}>
              {isAdminCreated ? "Admin created" : "Self created"}
            </span>
            <span style={{
              display: "inline-block",
              padding: "4px 12px",
              backgroundColor: "#d1fae5",
              color: "#065f46",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "600",
            }}>
              Active
            </span>
          </div>
        </div>

        {message && (
          <div style={{
            padding: "12px 16px",
            backgroundColor: "#d1fae5",
            color: "#065f46",
            borderRadius: "6px",
            marginBottom: "20px",
            fontSize: "14px",
          }}>
            {message}
          </div>
        )}

        {/* Personal Information */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          padding: "24px",
          marginBottom: "20px",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: "0 0 20px 0" }}>
            Personal information
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px", fontWeight: "600" }}>
                First name
              </label>
              <input
                type="text"
                defaultValue={user.name?.split(" ")[0] || ""}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px", fontWeight: "600" }}>
                Last name
              </label>
              <input
                type="text"
                defaultValue={user.name?.split(" ").slice(1).join(" ") || ""}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px", fontWeight: "600" }}>
              Email
            </label>
            <input
              type="email"
              defaultValue={user.email}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Roles & Status */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          padding: "24px",
          marginBottom: "20px",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: "0 0 20px 0" }}>
            Roles & status
          </h2>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isStudent}
                onChange={(e) => setIsStudent(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontSize: "14px", fontWeight: "500" }}>Student</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontSize: "14px", fontWeight: "500" }}>Admin</span>
            </label>
          </div>
          <button
            style={{
              padding: "8px 16px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Save roles
          </button>
        </div>

        {/* Remarks */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          padding: "24px",
          marginBottom: "20px",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: "0 0 16px 0" }}>
            Remarks
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add tags or notes about this user..."
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                fontFamily: "inherit",
                boxSizing: "border-box",
                minHeight: "60px",
              }}
            />
            <button
              style={{
                padding: "8px 16px",
                backgroundColor: "white",
                color: "#3b82f6",
                border: "1px solid #3b82f6",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Save
            </button>
          </div>
        </div>

        {/* Reset Password */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          padding: "24px",
          marginBottom: "20px",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: "0 0 16px 0" }}>
            Reset password
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            <button
              style={{
                padding: "8px 16px",
                backgroundColor: "white",
                color: "#3b82f6",
                border: "1px solid #3b82f6",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Assigned Papers */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          padding: "24px",
          marginBottom: "20px",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: "0 0 16px 0" }}>
            Assigned papers ({paperCount})
          </h2>
          {papers.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0" }}>No papers assigned yet</p>
          ) : (
            <ul style={{ margin: "0", paddingLeft: "20px", lineHeight: "1.8" }}>
              {papers.map((paper) => (
                <li key={paper.id} style={{ color: "#374151", fontSize: "14px" }}>
                  {paper.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Attempt History */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          padding: "24px",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: "0 0 16px 0" }}>
            Attempt history ({attemptCount})
          </h2>
          {attempts.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0" }}>No attempts yet</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ textAlign: "left", padding: "8px 0", color: "#6b7280", fontWeight: "600" }}>PAPER</th>
                    <th style={{ textAlign: "left", padding: "8px 0", color: "#6b7280", fontWeight: "600" }}>STATUS</th>
                    <th style={{ textAlign: "left", padding: "8px 0", color: "#6b7280", fontWeight: "600" }}>SCORE</th>
                    <th style={{ textAlign: "left", padding: "8px 0", color: "#6b7280", fontWeight: "600" }}>RESULT</th>
                    <th style={{ textAlign: "left", padding: "8px 0", color: "#6b7280", fontWeight: "600" }}>TIME TAKEN</th>
                    <th style={{ textAlign: "left", padding: "8px 0", color: "#6b7280", fontWeight: "600" }}>DATE</th>
                    <th style={{ textAlign: "left", padding: "8px 0", color: "#6b7280", fontWeight: "600" }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((att) => (
                    <tr key={att.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "8px 0", color: "#3b82f6", fontWeight: "500" }}>{att.paperTitle}</td>
                      <td style={{ padding: "8px 0", color: "#6b7280", fontSize: "12px" }}>{att.status}</td>
                      <td style={{ padding: "8px 0", color: "#1f2937" }}>{att.score ? `${att.score}%` : "—"}</td>
                      <td style={{ padding: "8px 0" }}>
                        {att.result ? (
                          <span style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "600",
                            backgroundColor: att.result === "Pass" ? "#d1fae5" : "#fee2e2",
                            color: att.result === "Pass" ? "#065f46" : "#991b1b",
                          }}>
                            {att.result}
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "8px 0", color: "#6b7280" }}>{formatTime(att.timeTaken)}</td>
                      <td style={{ padding: "8px 0", color: "#6b7280" }}>{formatDate(att.submittedAt || att.createdAt)}</td>
                      <td style={{ padding: "8px 0" }}>
                        <a href="#" style={{ color: "#3b82f6", fontSize: "12px", textDecoration: "none", fontWeight: "600" }}>
                          Review
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
