"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";

interface User {
  id: string;
  name: string | null;
  email: string;
  phone?: string | null;
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
  paperShortName?: string | null;
  status: string;
  score: number | null;
  result: string | null;
  timeTaken: number | null;
  submittedat: string | null;
  createdat: string;
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
  const [allPapers, setAllPapers] = useState<{ id: string; title: string }[]>([]);
  const [paperMessage, setPaperMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [paperBusy, setPaperBusy] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState("");

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
          setPhoneInput(userData.user.phone || "");
          setIsStudent(userData.user.role === "STUDENT" || userData.user.role === "BOTH");
          setIsAdmin(userData.user.role === "ADMIN" || userData.user.role === "BOTH");
        }

        // Load saved notes
        const remarksRes = await fetch(`/api/admin/user/${userId}/remarks`);
        if (remarksRes.ok) {
          const remarksData = await remarksRes.json();
          setRemarks(remarksData.remarks || "");
        }

        // Fetch assigned and available papers
        await loadAssignments();

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


  const loadAssignments = async () => {
    const [assignedRes, allRes] = await Promise.all([
      fetch(`/api/admin/user/${userId}/papers`),
      fetch("/api/papers"),
    ]);
    if (assignedRes.ok) {
      const data = await assignedRes.json();
      setPapers((data.papers || []).map((p: any) => ({ id: p.paperId, title: p.title, status: "approved" })));
    }
    if (allRes.ok) {
      const data = await allRes.json();
      setAllPapers((data.papers || []).map((p: any) => ({ id: p.id, title: p.title })));
    }
  };

  const changePaperAccess = async (paperId: string, action: "assign-paper" | "remove-paper") => {
    setPaperBusy(true);
    setPaperMessage(null);
    try {
      const res = await fetch(`/api/admin/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, paperId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPaperMessage({ type: "success", text: action === "assign-paper" ? "Paper assigned" : "Paper removed" });
        await loadAssignments();
      } else {
        setPaperMessage({ type: "error", text: data.error || "Something went wrong. Please try again." });
      }
    } catch {
      setPaperMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setPaperBusy(false);
    }
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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

  const savePhone = async () => {
    setPhoneSaving(true);
    setPhoneMessage("");
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhoneMessage(data.error || "Could not save the mobile number");
        return;
      }
      setUser((prev) => (prev ? { ...prev, phone: data.user?.phone ?? null } : prev));
      setPhoneInput(data.user?.phone || "");
      setPhoneMessage("Mobile number saved");
    } catch {
      setPhoneMessage("Could not save the mobile number");
    } finally {
      setPhoneSaving(false);
    }
  };

  const isAdminCreated = false; // Would come from user.createdBy or similar
  const paperCount = papers.length;
  const attemptCount = attempts.length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <AdminNav />

      {/* Header, same style as the dashboard pages */}
      <div className="max-w-7xl mx-auto px-6 pt-10">
        <Link href="/admin/users" className="text-blue-700 hover:text-blue-800 font-medium text-sm block mb-4">
          ← Back to users
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{user.name || "User"}</h1>
        <p className="text-gray-600 mt-1">{user.email}</p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
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
          <div style={{ marginTop: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px", fontWeight: "600" }}>
              Mobile number
            </label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="9123 4567"
                style={{
                  width: "220px",
                  maxWidth: "100%",
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={savePhone}
                disabled={phoneSaving}
                style={{
                  padding: "8px 14px",
                  backgroundColor: phoneSaving ? "#9ca3af" : "#1e3a8a",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: phoneSaving ? "not-allowed" : "pointer",
                }}
              >
                {phoneSaving ? "Saving..." : "Save"}
              </button>
            </div>
            {phoneMessage && (
              <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: phoneMessage.startsWith("Mobile") ? "#065f46" : "#991b1b" }}>
                {phoneMessage}
              </p>
            )}
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
              backgroundColor: "#f59e0b",
              color: "#0f172a",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#d97706";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f59e0b";
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
            Notes
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add notes about this user..."
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
              onClick={async () => {
                const res = await fetch(`/api/admin/user/${userId}/remarks`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ remarks }),
                });
                setMessage(res.ok ? "Notes saved" : "Could not save notes");
              }}
              style={{
                padding: "8px 16px",
                backgroundColor: "#f59e0b",
                color: "#0f172a",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#d97706";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f59e0b";
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
                backgroundColor: "#f59e0b",
                color: "#0f172a",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#d97706";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f59e0b";
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
            Papers ({paperCount} assigned)
          </h2>

          {paperMessage && (
            <div style={{
              padding: "10px 14px",
              marginBottom: "16px",
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: paperMessage.type === "success" ? "#d1fae5" : "#fee2e2",
              color: paperMessage.type === "success" ? "#065f46" : "#991b1b",
            }}>
              {paperMessage.text}
            </div>
          )}

          <p style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", margin: "0 0 8px 0" }}>ASSIGNED</p>
          {papers.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 20px 0" }}>No papers assigned yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
              {papers.map((paper) => (
                <div key={paper.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 12px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px",
                }}>
                  <span style={{ fontSize: "14px", color: "#14532d", fontWeight: "500" }}>{paper.title}</span>
                  <button
                    onClick={() => changePaperAccess(paper.id, "remove-paper")}
                    disabled={paperBusy}
                    style={{
                      padding: "6px 12px", backgroundColor: "#dc2626", color: "white", border: "none",
                      borderRadius: "4px", fontSize: "12px", cursor: paperBusy ? "not-allowed" : "pointer",
                      opacity: paperBusy ? 0.5 : 1,
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <p style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", margin: "0 0 8px 0" }}>AVAILABLE TO ASSIGN</p>
          {allPapers.filter((p) => !papers.some((a) => a.id === p.id)).length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0" }}>All papers are assigned</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {allPapers
                .filter((p) => !papers.some((a) => a.id === p.id))
                .map((paper) => (
                  <div key={paper.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 12px", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px",
                  }}>
                    <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: "500" }}>{paper.title}</span>
                    <button
                      onClick={() => changePaperAccess(paper.id, "assign-paper")}
                      disabled={paperBusy}
                      style={{
                        padding: "6px 12px", backgroundColor: "#1e3a8a", color: "white", border: "none",
                        borderRadius: "4px", fontSize: "12px", cursor: paperBusy ? "not-allowed" : "pointer",
                        opacity: paperBusy ? 0.5 : 1,
                      }}
                    >
                      Assign
                    </button>
                  </div>
                ))}
            </div>
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
                      <td style={{ padding: "8px 0", color: "#1f2937", fontWeight: "500" }}>{att.paperShortName || att.paperTitle}</td>
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
                      <td style={{ padding: "8px 0", color: "#6b7280" }}>{formatDate(att.submittedat || att.createdat)}</td>
                      <td style={{ padding: "8px 0" }}>
                        <a href={`/admin/attempts/${att.id}`} style={{ color: "#f59e0b", fontSize: "12px", textDecoration: "none", fontWeight: "600", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#d97706";
                        }} onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#f59e0b";
                        }}>
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
