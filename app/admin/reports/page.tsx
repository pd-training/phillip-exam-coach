"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function Reports() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (status === "unauthenticated") {
    redirect("/login");
  }

  if ((session?.user as any)?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ margin: "0 0 8px 0" }}>📊 Reports & Analytics</h1>
      <p style={{ color: "#666", margin: "0 0 30px 0" }}>View exam statistics and performance data</p>

      <div style={{
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        textAlign: "center",
        color: "#666",
      }}>
        <p style={{ margin: "0", fontSize: "16px" }}>
          📈 Reports coming soon...
        </p>
        <p style={{ margin: "10px 0 0 0", fontSize: "14px" }}>
          Analytics dashboard will show exam performance, pass rates, and student progress.
        </p>
      </div>
    </div>
  );
}
