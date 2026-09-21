"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export default function UserManagement() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    roles: { student: true, admin: false },
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session?.user || (session?.user as any)?.role !== "ADMIN") {
      router.push("/login");
      return;
    }
  }, [status, session, router]);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Search filter
  useEffect(() => {
    const filtered = users.filter((user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = `${window.location.origin}/login`;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const selectedRole = formData.roles.admin ? "ADMIN" : "STUDENT";

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email: formData.email,
          password: formData.password,
          role: selectedRole,
        }),
      });

      if (res.ok) {
        setSuccess("User created successfully!");
        setFormData({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          password: "",
          roles: { student: true, admin: false },
        });
        await fetchUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to create user");
      }
    } catch (error) {
      setError("An error occurred while creating the user");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || !session?.user) return null;

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Navigation Bar */}
      <nav style={{
        backgroundColor: "white",
        borderBottom: "1px solid #e5e7eb",
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", gap: "32px" }}>
          <a href="/admin/dashboard" style={{ textDecoration: "none", color: "#666", fontWeight: "500", fontSize: "14px" }}>
            Dashboard
          </a>
          <a href="/admin/papers" style={{ textDecoration: "none", color: "#666", fontWeight: "500", fontSize: "14px" }}>
            Papers
          </a>
          <a href="/admin/users" style={{ textDecoration: "none", color: "#3b82f6", fontWeight: "600", fontSize: "14px" }}>
            Users
          </a>
          <a href="/admin/questions" style={{ textDecoration: "none", color: "#666", fontWeight: "500", fontSize: "14px" }}>
            Questions
          </a>
        </div>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <a href="/account" style={{ color: "#666", fontSize: "14px", textDecoration: "none", cursor: "pointer" }}>
            Account
          </a>
          <span style={{ fontWeight: "600", fontSize: "14px" }}>{session?.user?.name || "Admin"}</span>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "transparent",
              color: "#3b82f6",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Log out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "30px 20px" }}>
        {/* Page Title */}
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1f2937", margin: "0 0 8px 0" }}>
            👥 Users
          </h1>
          <p style={{ color: "#6b7280", margin: "0", fontSize: "14px" }}>Manage advisors and students</p>
        </div>

        {/* Success Message */}
        {success && (
          <div style={{
            backgroundColor: "#d1fae5",
            border: "1px solid #6ee7b7",
            color: "#065f46",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: "500",
          }}>
            ✅ {success}
          </div>
        )}

        {/* Search Bar */}
        <div style={{ marginBottom: "30px" }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "12px 16px",
              fontSize: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Users Table */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          marginBottom: "40px",
          overflow: "hidden",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
            }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
                    NAME
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
                    EMAIL
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
                    ROLES
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
                    STATUS
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
                    CREATED VIA
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                      Loading...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "#f9fafb";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "white";
                      }}
                    >
                      <td style={{ padding: "16px", fontSize: "14px", fontWeight: "500", color: "#1f2937" }}>
                        {user.name || "—"}
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px", color: "#2563eb" }}>
                        {user.email}
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px" }}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {user.role.split(",").map((role) => (
                            <span
                              key={role}
                              style={{
                                display: "inline-block",
                                padding: "4px 12px",
                                backgroundColor: role === "ADMIN" ? "#fee2e2" : "#dbeafe",
                                color: role === "ADMIN" ? "#991b1b" : "#1e40af",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            backgroundColor: user.active ? "#d1fae5" : "#fecaca",
                            color: user.active ? "#065f46" : "#991b1b",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        >
                          {user.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px", color: "#6b7280" }}>
                        Admin created
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create User Form */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          padding: "32px",
        }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937", margin: "0 0 24px 0" }}>
            Create user
          </h2>

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

          <form onSubmit={handleCreateUser}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#374151" }}>
                  First name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
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
                  placeholder="Doe"
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
                  Phone (+65...)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9123 4567"
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
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@phillip.com"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#374151" }}>
                  Temporary password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "20px", marginBottom: "24px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.roles.student}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      roles: { ...formData.roles, student: e.target.checked },
                    })
                  }
                  style={{ cursor: "pointer" }}
                />
                <span style={{ fontSize: "14px", color: "#374151" }}>Student</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.roles.admin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      roles: { ...formData.roles, admin: e.target.checked },
                    })
                  }
                  style={{ cursor: "pointer" }}
                />
                <span style={{ fontSize: "14px", color: "#374151" }}>Admin</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: submitting ? "#9ca3af" : "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Creating user..." : "Create user"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
