"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AdminNav } from "@/app/components/AdminNav";

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
      router.push("/dashboard");
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
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <AdminNav title="📋 Assign Papers" subtitle="Grant students access to exam papers" />

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "30px 20px" }}>
        <div style={{ maxWidth: "500px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
              Student:
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            >
              <option value="">-- Select student --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email} ({u.name})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
              Paper:
            </label>
            <select
              value={selectedPaper}
              onChange={(e) => setSelectedPaper(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
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
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Assign Paper
          </button>

          {message && (
            <p style={{ marginTop: "16px", fontSize: "14px", color: "#666" }}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
