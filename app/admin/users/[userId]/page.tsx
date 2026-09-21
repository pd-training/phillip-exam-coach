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
  createdAt: Date;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const { data: session, status } = useSession();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  // Auth & redirect
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session?.user || (session?.user as any)?.role !== "ADMIN") {
      router.push("/login");
    }
  }, [status, session, router]);

  // Fetch user
  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          const [firstName, lastName] = (data.user.name || "").split(" ");
          setFormData({
            firstName: firstName || "",
            lastName: lastName || "",
            email: data.user.email,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = `${window.location.origin}/login`;
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
          <a style={{ color: "#2563eb", fontSize: "14px", textDecoration: "none" }}>
            ← Back to users
          </a>
        </Link>
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

      {/* Content */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1f2937", margin: "0 0 12px 0" }}>
            {user.name || "—"}
          </h1>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: "0" }}>
            {user.email}
          </p>
          <span style={{
            display: "inline-block",
            marginTop: "16px",
            padding: "4px 12px",
            backgroundColor: "#e0e7ff",
            color: "#3730a3",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "600",
          }}>
            {user.role}
          </span>
        </div>

        {/* User Info Card */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          padding: "24px",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", margin: "0 0 20px 0" }}>
            User Information
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                Name
              </label>
              <p style={{ margin: "0", fontSize: "14px" }}>{user.name || "—"}</p>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                Email
              </label>
              <p style={{ margin: "0", fontSize: "14px" }}>{user.email}</p>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                Role
              </label>
              <p style={{ margin: "0", fontSize: "14px" }}>{user.role}</p>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                Created
              </label>
              <p style={{ margin: "0", fontSize: "14px" }}>
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
