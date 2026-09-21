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
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      console.log("Logging out with baseUrl:", baseUrl);
      const callbackUrl = `${baseUrl}/login`;
      console.log("Callback URL:", callbackUrl);
      await signOut({ redirect: true, callbackUrl });
    } catch (error) {
      console.error("Logout error:", error);
      if (typeof window !== "undefined") {
        window.location.href = `${window.location.origin}/login`;
      }
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
          <a href="/admin/dashboard" style={{ textDecoration: "none", color: "#3b82f6", fontWeight: "600", fontSize: "14px" }}>
            Dashboard
          </a>
          <a href="/admin/papers" style={{ textDecoration: "none", color: "#666", fontWeight: "500", fontSize: "14px" }}>
            Papers
          </a>
          <a href="/admin/users" style={{ textDecoration: "none", color: "#666", fontWeight: "500", fontSize: "14px" }}>
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

      {/* Main Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>

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
    </div>
  );
}
