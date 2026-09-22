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

export default function AssignPapersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedPaper, setSelectedPaper] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

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

  const fetchData = async () => {
    try {
      const [usersRes, papersRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/papers")
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers((data.users || []).filter((u: any) => u.role === "STUDENT"));
      }

      if (papersRes.ok) {
        const data = await papersRes.json();
        setPapers(data.papers || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUser || !selectedPaper) {
      setMessage("⚠️ Select both user and paper");
      return;
    }

    try {
      const res = await fetch("/api/admin/assign-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser, paperId: selectedPaper })
      });

      if (res.ok) {
        setMessage("✅ Paper assigned successfully");
        setSelectedPaper("");
      } else {
        const error = await res.json();
        setMessage(`❌ ${error.error}`);
      }
    } catch (error) {
      setMessage("❌ Failed to assign paper");
    }
  };

  if (status === "loading" || loading) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (status === "unauthenticated" || (session?.user as any)?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Assign Papers</h1>
        <p className="text-gray-600 mb-8">Grant students access to exam papers</p>
        
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-2xl">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Student:
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-600"
            >
              <option value="">-- Select student --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email} ({u.name})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Paper:
            </label>
            <select
              value={selectedPaper}
              onChange={(e) => setSelectedPaper(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-600"
            >
              <option value="">-- Select paper --</option>
              {papers.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAssign}
            className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Assign Paper
          </button>

          {message && (
            <p className="mt-4 text-sm text-gray-700">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
