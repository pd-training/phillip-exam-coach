"use client";

"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Handle auth redirects
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (!session?.user) {
      router.push("/login");
      return;
    }

    if ((session?.user as any)?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  // Don't render until we know they're an admin
  if (status === "unauthenticated" || !session?.user || (session?.user as any)?.role !== "ADMIN") {
    return null;
  }

  const handleLogout = async () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    await signOut({ redirect: true, callbackUrl: `${baseUrl}/login` });
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      {/* Header with logout */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ margin: "0 0 8px 0" }}>👨‍💼 Admin Dashboard</h1>
          <p style={{ color: "#666", margin: "0" }}>Welcome, {session?.user?.name || "Admin"}!</p>
        </div>
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
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#dc2626";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ef4444";
          }}
        >
          🚪 Logout
        </button>
      </div>

      <section style={{ marginTop: "30px" }}>
        <h2>📊 Admin Controls</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Manage users, papers, and exam configuration
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {[
            { title: "👥 User Management", desc: "Add/edit users and advisors", icon: "👥", href: "/admin/users" },
            { title: "📝 Paper Management", desc: "Create and manage exam papers", icon: "📝", href: "/admin/papers" },
            { title: "❓ Question Bank", desc: "Manage exam questions", icon: "❓", href: "/admin/questions" },
            { title: "📊 Reports", desc: "View exam statistics", icon: "📊", href: "/admin/reports" },
          ].map((item, idx) => (
            <a key={idx} href={item.href} style={{ textDecoration: "none" }}>
              <div
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
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>{item.icon}</div>
                <h3 style={{ marginBottom: "5px" }}>{item.title}</h3>
                <p style={{ color: "#666", fontSize: "14px" }}>{item.desc}</p>
              </div>
            </a>
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
