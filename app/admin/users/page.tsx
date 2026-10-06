"use client";

import AdminNav from "@/components/AdminNav";
import { useSession } from "next-auth/react";
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
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState("");
  const [suspendingUserId, setSuspendingUserId] = useState<string | null>(null);

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

  const handleDeleteUser = async () => {
    setError(null);

    if (!deleteUserId || !confirmDeleteName.trim()) {
      setError("Please type the user name to confirm deletion");
      return;
    }

    // Find the user to get their actual name
    const userToDelete = users.find(u => u.id === deleteUserId);
    if (!userToDelete || confirmDeleteName !== userToDelete.name) {
      setError("User name does not match. Please type the exact name.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deleteUserId }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || "User deleted successfully");
        setDeleteUserId(null);
        setConfirmDeleteName("");
        await fetchUsers();
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(data.error || "Failed to delete user");
      }
    } catch (error: any) {
      setError(error?.message || "An error occurred while deleting the user");
      console.error("Delete error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspendUser = async (userId: string, currentActive: boolean) => {
    setSuspendingUserId(userId);
    setError(null);

    try {
      const newActiveStatus = !currentActive;
      const res = await fetch("/api/admin/suspend-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, active: newActiveStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || `User ${newActiveStatus ? "activated" : "suspended"} successfully`);
        await fetchUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "Failed to update user status");
      }
    } catch (error: any) {
      setError(error?.message || "An error occurred while updating user status");
      console.error("Suspend error:", error);
    } finally {
      setSuspendingUserId(null);
    }
  };

  if (status === "loading" || !session?.user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Users</h1>
          <p className="text-gray-600">Manage advisors and students</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
            ✅ {success}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-gray-200 mb-12 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
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
                  <th style={{ padding: "16px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                      Loading...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#666" }}>
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
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSuspendUser(user.id, user.active);
                            }}
                            disabled={suspendingUserId === user.id}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: user.active ? "#f59e0b" : "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: suspendingUserId === user.id ? "not-allowed" : "pointer",
                              transition: "background-color 0.2s",
                              opacity: suspendingUserId === user.id ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => {
                              if (suspendingUserId !== user.id) {
                                e.currentTarget.style.backgroundColor = user.active ? "#d97706" : "#059669";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = user.active ? "#f59e0b" : "#10b981";
                            }}
                          >
                            {suspendingUserId === user.id ? "..." : user.active ? "Suspend" : "Activate"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteUserId(user.id);
                              setError(null);
                            }}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#ef4444",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#dc2626";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#ef4444";
                            }}
                          >
                            Delete
                          </button>
                        </div>
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

        {/* Delete Confirmation Modal */}
        {deleteUserId && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}>
              <h3 style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#1f2937",
                margin: "0 0 16px 0",
              }}>
                Delete User Account
              </h3>
              <p style={{
                color: "#6b7280",
                fontSize: "14px",
                margin: "0 0 16px 0",
                lineHeight: "1.5",
              }}>
                This action cannot be undone. All data associated with this user will be permanently deleted.
              </p>
              <p style={{
                color: "#991b1b",
                fontSize: "13px",
                backgroundColor: "#fee2e2",
                padding: "12px",
                borderRadius: "6px",
                margin: "0 0 16px 0",
              }}>
                User: <strong>{users.find(u => u.id === deleteUserId)?.name}</strong> ({users.find(u => u.id === deleteUserId)?.email})
              </p>
              <p style={{
                color: "#374151",
                fontSize: "14px",
                margin: "0 0 12px 0",
                fontWeight: "500",
              }}>
                To confirm, type the user's name below:
              </p>
              <input
                type="text"
                value={confirmDeleteName}
                onChange={(e) => setConfirmDeleteName(e.target.value)}
                placeholder={users.find(u => u.id === deleteUserId)?.name || ""}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  marginBottom: "20px",
                }}
              />
              <div style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}>
                <button
                  onClick={() => {
                    setDeleteUserId(null);
                    setConfirmDeleteName("");
                    setError(null);
                  }}
                  disabled={submitting}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#e5e7eb",
                    color: "#1f2937",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: submitting ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) e.currentTarget.style.backgroundColor = "#d1d5db";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#e5e7eb";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={submitting || !confirmDeleteName.trim()}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: submitting || !confirmDeleteName.trim() ? "not-allowed" : "pointer",
                    opacity: submitting || !confirmDeleteName.trim() ? 0.6 : 1,
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting && confirmDeleteName.trim()) e.currentTarget.style.backgroundColor = "#dc2626";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ef4444";
                  }}
                >
                  {submitting ? "Deleting..." : "Delete Account"}
                </button>
              </div>
              {error && (
                <div style={{
                  marginTop: "16px",
                  padding: "12px",
                  backgroundColor: "#fee2e2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
