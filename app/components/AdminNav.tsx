"use client";

import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

interface AdminNavProps {
  title: string;
  subtitle?: string;
}

export function AdminNav({ title, subtitle }: AdminNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Papers", href: "/admin/papers" },
    { label: "Users", href: "/admin/users" },
    { label: "Questions", href: "/admin/questions" },
    { label: "Assign Papers", href: "/admin/assign-papers" },
  ];

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  return (
    <>
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
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                textDecoration: "none",
                color: pathname === item.href ? "#3b82f6" : "#666",
                fontWeight: pathname === item.href ? "600" : "500",
                fontSize: "14px",
              }}
            >
              {item.label}
            </a>
          ))}
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
              fontWeight: "500"
            }}
          >
            Log out
          </button>
        </div>
      </nav>

      {/* Page Header */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "30px 20px" }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: "28px" }}>{title}</h1>
        {subtitle && <p style={{ color: "#666", margin: "0", fontSize: "14px" }}>{subtitle}</p>}
      </div>
    </>
  );
}
