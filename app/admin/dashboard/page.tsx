"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function AdminDashboard() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (status === "unauthenticated") {
    redirect("/login");
  }

  if (!session?.user) {
    redirect("/login");
  }

  // Only admins can access this page
  if ((session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1>👨‍💼 Admin Dashboard</h1>
      <p>Welcome, {session?.user?.name || "Admin"}!</p>

      <section style={{ marginTop: "30px" }}>
        <h2>📊 Admin Controls</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Manage users, papers, and exam configuration
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {[
            { title: "👥 User Management", desc: "Add/edit users and advisors", icon: "👥" },
            { title: "📝 Paper Management", desc: "Create and manage exam papers", icon: "📝" },
            { title: "❓ Question Bank", desc: "Manage exam questions", icon: "❓" },
            { title: "📊 Reports", desc: "View exam statistics", icon: "📊" },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>{item.icon}</div>
              <h3 style={{ marginBottom: "5px" }}>{item.title}</h3>
              <p style={{ color: "#666", fontSize: "14px" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: "40px", padding: "20px", backgroundColor: "#f0f0f0", borderRadius: "8px" }}>
        <h3>🔧 Quick Actions</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <a href="/api/admin/prisma-seed">
            <button style={{ padding: "10px 20px", backgroundColor: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              🌱 Seed Database
            </button>
          </a>
          <button style={{ padding: "10px 20px", backgroundColor: "#666", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            📋 View Logs
          </button>
        </div>
      </section>
    </div>
  );
}
