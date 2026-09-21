"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  pdpaConsent: boolean;
  createdAt: string;
}

interface Paper {
  id: string;
  title: string;
}

interface Attempt {
  id: string;
  paperId: string;
  paperTitle: string;
  status: string;
  overallScore: number | null;
  passed: boolean | null;
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
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  // Auth check
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session?.user || (session?.user as any)?.role !== "ADMIN") {
      router.push("/login");
      return;
    }
  }, [status, session, router]);

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          const [firstName, lastName] = (data.user.name || "").split(" ");
          setFormData({
            firstName: firstName || "",
            lastName: lastName || "",
            phone: "",
            email: data.user.email,
          });

          // Fetch papers and attempts
          const papersRes = await fetch(`/api/users/${userId}/papers`);
          if (papersRes.ok) {
            const papersData = await papersRes.json();
            setPapers(papersData.papers || []);
          }

          const attemptsRes = await fetch(`/api/users/${userId}/attempts`);
          if (attemptsRes.ok) {
            const attemptsData = await attemptsRes.json();
            setAttempts(attemptsData.attempts || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = `${window.location.origin}/login`;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, email: formData.email }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to update profile");
      }
    } catch (error) {
      setError("An error occurred while updating the profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      setError("Please enter a new password");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/users/${userId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (res.ok) {
        setNewPassword("");
        setSuccess("Password reset successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to reset password");
      }
    } catch (error) {
      setError("An error occurred while resetting the password");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading || !user) {
    return null;
  }

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
        <div style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}>
          <Link href="/admin/users">
            <a style={{
              color: "#2563eb",
              fontSize: "14px",
              textDecoration: "none",
              cursor: "pointer",
            }}>
              ← Back to users
            </a>
          </Link>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          🚪 Logout
        </button>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
        {/* User Header */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1f2937", margin: "0 0 12px 0" }}>
            {user.name || "—"}
          </h1>
          <p style={{ color: "#6b7280", margin: "0 0 16px 0", fontSize: "14px" }}>
            {user.email}
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={{
              display: "inline-block",
              padding: "4px 12px",
              backgroundColor: "#bfdbfe",
              color: "#1e40af",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "600",
            }}>
              Admin created
            </span>
            <span style={{
              display: "inline-block",
              padding: "4px 12px",
              backgroundColor: "#e0e7ff",
              color: "#3730a3",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "600",
            }}>
              Test user
            </span>
            <span style={{
              display: "inline-block",
              padding: "4px 12px",
              backgroundColor: user.active ? "#d1fae5" : "#fecaca",
              color: user.active ? "#065f46" : "#991b1b",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "600",
            }}>
              {user.active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
          }}>
            ❌ {error}
          </div>
        )}
        {success && (
          <div style={{
            backgroundColor: "#d1fae5",
            border: "1px solid #6ee7b7",
            color: "#065f46",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
          }}>
            ✅ {success}
          </div>
        )}

        {/* Personal Information */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          padding: "24px",
          marginBottom: "24px",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: "0 0 20px 0" }}>
            Personal information
          </h2>
          <form onSubmit={handleSaveProfile}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#374151" }}>
                  First name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#374151" }}>
                  Last name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#374151" }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#374151" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "12px", fontSize: "14px", color: "#6b7280" }}>
              PDPA consent: {user.pdpaConsent ? "Recorded" : "Not recorded"}
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 24px",
                backgroundColor: submitting ? "#9ca3af" : "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </form>
        </div>

        {/* Roles & Status */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          padding: "24px",
          marginBottom: "24px",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: "0 0 20px 0" }}>
            Roles & status
          </h2>
          <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={user.role === "STUDENT" || user.role === "STUDENT,ADMIN"}
                readOnly
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontSize: "14px", color: "#374151" }}>Student</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={user.role === "ADMIN" || user.role === "STUDENT,ADMIN"}
                readOnly
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontSize: "14px", color: "#374151" }}>Admin</span>
            </label>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button style={{
              padding: "8px 20px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}>
              Disable account
            </button>
            <button style={{
              padding: "8px 20px",
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}>
              Delete
            </button>
          </div>
        </div>

        {/* Reset Password */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          padding: "24px",
          marginBottom: "24px",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: "0 0 20px 0" }}>
            Reset password
          </h2>
          <div style={{ display: "flex", gap: "12px" }}>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                flex: 1,
                padding: "10px 12px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
              }}
            />
            <button
              onClick={handleResetPassword}
              disabled={submitting}
              style={{
                padding: "10px 24px",
                backgroundColor: submitting ? "#9ca3af" : "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Resetting..." : "Reset"}
            </button>
          </div>
        </div>

        {/* Assigned Papers */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          padding: "24px",
          marginBottom: "24px",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: "0 0 20px 0" }}>
            Assigned papers ({papers.length})
          </h2>
          {papers.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0" }}>No papers assigned</p>
          ) : (
            <ul style={{ listStyle: "none", padding: "0", margin: "0" }}>
              {papers.map((paper) => (
                <li key={paper.id} style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #f3f4f6",
                  color: "#1f2937",
                  fontSize: "14px",
                }}>
                  {paper.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Attempt History */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          padding: "24px",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: "0 0 20px 0" }}>
            Attempt history ({attempts.length})
          </h2>
          {attempts.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0" }}>No attempts yet</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#6b7280" }}>Paper</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#6b7280" }}>Status</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#6b7280" }}>Score</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#6b7280" }}>Result</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#6b7280" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt) => (
                    <tr key={attempt.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px", color: "#1f2937" }}>{attempt.paperTitle}</td>
                      <td style={{ padding: "12px", color: "#6b7280", textTransform: "uppercase", fontSize: "12px", fontWeight: "600" }}>
                        {attempt.status}
                      </td>
                      <td style={{ padding: "12px", color: "#1f2937" }}>
                        {attempt.overallScore !== null ? `${attempt.overallScore.toFixed(1)}%` : "—"}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {attempt.passed === null ? (
                          <span style={{ color: "#6b7280" }}>—</span>
                        ) : (
                          <span style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            backgroundColor: attempt.passed ? "#d1fae5" : "#fee2e2",
                            color: attempt.passed ? "#065f46" : "#991b1b",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}>
                            {attempt.passed ? "Pass" : "Fail"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px", color: "#6b7280" }}>
                        {new Date(attempt.createdAt).toLocaleDateString()}
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
