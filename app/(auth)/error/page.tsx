"use client";

export default function ErrorPage() {
  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "20px", textAlign: "center" }}>
      <h1>❌ Login Failed</h1>
      <p>Invalid credentials or database error.</p>
      <p style={{ fontSize: "12px", color: "#666" }}>
        Make sure the admin user exists in the database.
      </p>
      <a href="/auth/login" style={{ color: "blue", textDecoration: "underline" }}>
        Try again
      </a>
    </div>
  );
}
