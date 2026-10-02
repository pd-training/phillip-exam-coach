"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Paper {
  id: string;
  title: string;
}

interface AssignedPaper extends Paper {
  assigned: boolean;
}

export default function AssignPapersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [userPapers, setUserPapers] = useState<AssignedPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchUserTerm, setSearchUserTerm] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if ((session?.user as any)?.role !== "ADMIN") {
      router.push("/admin/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  // Filter users based on search
  useEffect(() => {
    if (searchUserTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const term = searchUserTerm.toLowerCase();
      setFilteredUsers(
        users.filter((u) => u.email.toLowerCase().includes(term) || u.name.toLowerCase().includes(term))
      );
    }
  }, [searchUserTerm, users]);

  const fetchData = async () => {
    try {
      const [usersRes, papersRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/papers")
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers((data.users || []).filter((u: any) => u.role === "STUDENT"));
        setFilteredUsers((data.users || []).filter((u: any) => u.role === "STUDENT"));
      }

      if (papersRes.ok) {
        const data = await papersRes.json();
        setPapers(data.papers || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setMessage({ type: "error", text: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPapers = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/user/${userId}/papers`);
      if (res.ok) {
        const data = await res.json();
        const assignedPaperIds = new Set(data.papers.map((p: any) => p.paperId));
        const papersWithStatus = papers.map((p) => ({
          ...p,
          assigned: assignedPaperIds.has(p.id),
        }));
        setUserPapers(papersWithStatus);
      }
    } catch (error) {
      console.error("Error fetching user papers:", error);
    }
  };

  const handleUserSelect = async (userId: string) => {
    setSelectedUser(userId);
    await fetchUserPapers(userId);
  };

  const handleAssignPaper = async (paperId: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/assign-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser, paperId }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Paper assigned successfully" });
        await fetchUserPapers(selectedUser);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to assign paper" });
      }
    } catch (error) {
      console.error("Error assigning paper:", error);
      setMessage({ type: "error", text: "Error assigning paper" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemovePaper = async (paperId: string) => {
    if (!confirm("Are you sure you want to remove this paper from the student?")) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/remove-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser, paperId }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Paper removed successfully" });
        await fetchUserPapers(selectedUser);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to remove paper" });
      }
    } catch (error) {
      console.error("Error removing paper:", error);
      setMessage({ type: "error", text: "Error removing paper" });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-0">
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-3xl font-bold">Assign Papers to Students</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || (session?.user as any)?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-0">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl font-bold">Assign Papers to Students</h1>
          <p className="text-blue-100 mt-2">Manage paper access for individual students</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Students List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Student</h2>
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchUserTerm}
                onChange={(e) => setSearchUserTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No students found</p>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        selectedUser === user.id
                          ? "bg-blue-100 text-blue-900 border-l-4 border-blue-600"
                          : "hover:bg-gray-100 border-l-4 border-transparent"
                      }`}
                    >
                      <p className="font-medium text-sm">{user.name || "N/A"}</p>
                      <p className="text-xs text-gray-600">{user.email}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Papers Assignment */}
          <div className="lg:col-span-2">
            {selectedUser ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Manage Papers</h2>

                {userPapers.length === 0 ? (
                  <p className="text-gray-500 mb-6">No papers available</p>
                ) : (
                  <>
                    {userPapers.filter((p) => p.assigned).length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Currently Assigned</h3>
                        <div className="space-y-2">
                          {userPapers.filter((p) => p.assigned).map((paper) => (
                            <div
                              key={paper.id}
                              className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200"
                            >
                              <span className="text-sm font-medium text-green-900">{paper.title}</span>
                              <button
                                onClick={() => handleRemovePaper(paper.id)}
                                disabled={submitting}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 transition"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Available to Assign</h3>
                      <div className="space-y-2">
                        {userPapers.filter((p) => !p.assigned).map((paper) => (
                          <div
                            key={paper.id}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                          >
                            <span className="text-sm font-medium text-gray-900">{paper.title}</span>
                            <button
                              onClick={() => handleAssignPaper(paper.id)}
                              disabled={submitting}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 transition"
                            >
                              Assign
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">Select a student to manage their paper assignments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
