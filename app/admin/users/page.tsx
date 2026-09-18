"use client";

import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function UserManagement() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // Log auth status for debugging
  useEffect(() => {
    console.log("Auth Status:", status);
    console.log("Session:", session);
  }, [status, session]);

  if (status === "loading") {
    return <div style={{ padding: "20px" }}>🔄 Loading session...</div>;
  }

  if (status === "unauthenticated") {
    console.log("Not authenticated, redirecting to /login");
    redirect("/login");
  }

  if (!session?.user) {
    console.log("No session.user, redirecting to /login");
    redirect("/login");
  }

  const userRole = (session?.user as any)?.role;
  console.log("User role:", userRole);

  if (userRole !== "ADMIN") {
    console.log("Not admin, redirecting to /dashboard");
    redirect("/dashboard");
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setError(null);
      } else {
        const errorData = await res.json();
        setError(`API Error: ${errorData.error || res.statusText}`);
        console.error("API Error:", errorData);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setError(`Failed to fetch users: ${msg}`);
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    await signOut({ redirect: true, callbackUrl: `${baseUrl}/login` });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (res.ok) {
        setName("");
        setEmail("");
        setPassword("");
        setRole("STUDENT");
        setShowForm(false);
        await fetchUsers();
      } else {
        const error = await res.json();
        alert("Error: " + error.error);
      }
    } catch (error) {
      console.error("Failed to create user:", error);
      alert("Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ margin: "0 0 8px 0" }}>👥 User Management</h1>
          <p style={{ color: "#666", margin: "0" }}>Add and manage advisors and students</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <a href="/admin/dashboard">
            <button style={{
              padding: "10px 20px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}>
              ← Back
            </button>
          </a>
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* New User Button */}
      <div style={{ marginBottom: "30px" }}>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#1f2937",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          {showForm ? "✕ Cancel" : "+ New User"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          marginBottom: "30px",
        }}>
          <h3 style={{ marginTop: "0", marginBottom: "20px" }}>Add New User</h3>
          <form onSubmit={handleCreateUser}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@phillip.com"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="STUDENT">Student</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 24px",
                backgroundColor: submitting ? "#9ca3af" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Creating..." : "Create User"}
            </button>
          </form>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: "#fee2e2",
          border: "1px solid #fecaca",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "20px",
          color: "#991b1b",
          fontSize: "14px",
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Users List */}
      <div>
        {loading ? (
          <p style={{ color: "#666" }}>Loading users...</p>
        ) : users.length === 0 ? (
          <div style={{
            backgroundColor: "#f3f4f6",
            padding: "40px",
            borderRadius: "12px",
            textAlign: "center",
            color: "#666",
          }}>
            <p style={{ margin: "0" }}>No users found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "white",
              borderRadius: "12px",
              overflow: "hidden",
            }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "14px", fontWeight: "600" }}>Name</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "14px", fontWeight: "600" }}>Email</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "14px", fontWeight: "600" }}>Role</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "14px", fontWeight: "600" }}>Joined</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "14px", fontWeight: "600" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px 16px" }}>{user.name}</td>
                    <td style={{ padding: "12px 16px", color: "#0070f3" }}>{user.email}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        backgroundColor: user.role === "ADMIN" ? "#fecaca" : "#bfdbfe",
                        color: user.role === "ADMIN" ? "#991b1b" : "#1e40af",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#666", fontSize: "13px" }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button style={{
                        padding: "6px 12px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
// Amplify redeploy trigger
