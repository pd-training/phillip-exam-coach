"use client";

import { Suspense } from "react";
import { LoginForm } from "./form";

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8f9fa" }}>
      <div style={{ width: "100%", maxWidth: "420px", padding: "40px 24px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📚</div>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#1f2937", margin: "0 0 12px 0" }}>
            Phillip Exam Coach
          </h1>
          <p style={{ color: "#6b7280", margin: "0", fontSize: "16px", fontWeight: "500" }}>
            Begin your exam prep journey
          </p>
        </div>

        {/* Login Form with Suspense */}
        <Suspense fallback={
          <div style={{
            backgroundColor: "white",
            padding: "32px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            textAlign: "center",
            color: "#666",
          }}>
            Loading...
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
