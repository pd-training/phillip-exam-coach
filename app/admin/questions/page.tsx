"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function QuestionBank() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session?.user || (session?.user as any)?.role !== "ADMIN") {
      router.push("/login");
      return;
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (status === "unauthenticated" || !session?.user || (session?.user as any)?.role !== "ADMIN") {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      window.location.href = '/login';
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = '/login';
    }
  };

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
          <a href="/admin/users" style={{ textDecoration: "none", color: "#666", fontWeight: "500", fontSize: "14px" }}>
            Users
          </a>
          <a href="/admin/questions" style={{ textDecoration: "none", color: "#3b82f6", fontWeight: "600", fontSize: "14px" }}>
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

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "30px 20px" }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: "28px" }}>❓ Question Bank</h1>
        <p style={{ color: "#666", margin: "0 0 30px 0", fontSize: "14px" }}>Manage exam questions</p>

        <div style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          textAlign: "center",
          color: "#666",
        }}>
          <p style={{ margin: "0", fontSize: "16px" }}>
            📝 Question Bank management coming soon...
          </p>
          <p style={{ margin: "10px 0 0 0", fontSize: "14px" }}>
            Questions are currently seeded from the database. You can edit them through the database directly or wait for the UI.
          </p>
        </div>
      </div>
    </div>
  );
}

