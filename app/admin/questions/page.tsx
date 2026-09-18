"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function QuestionBank() {
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
      <h1 style={{ margin: "0 0 8px 0" }}>❓ Question Bank</h1>
      <p style={{ color: "#666", margin: "0 0 30px 0" }}>Manage exam questions</p>

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
  );
}
