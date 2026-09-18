"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        setError("Invalid email or password");
        return;
      }

      // Wait a moment for session to be established, then check role
      setTimeout(async () => {
        try {
          const sessionRes = await fetch("/api/auth/session");
          const session = await sessionRes.json();
          
          if (session?.user?.role === "ADMIN") {
            router.push("/admin/dashboard");
          } else {
            router.push("/dashboard");
          }
          router.refresh();
        } catch (err) {
          // Fallback - just go to dashboard
          router.push("/dashboard");
          router.refresh();
        }
      }, 100);
    } catch (err) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "20px" }}>
      <h1>Phillip Exam Coach - Login</h1>
      
      {error && (
        <div style={{ color: "red", marginBottom: "15px", padding: "10px", backgroundColor: "#ffe0e0", borderRadius: "4px" }}>
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px", boxSizing: "border-box" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: loading ? "#ccc" : "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
        <p style={{ margin: "0 0 10px 0", fontWeight: "bold" }}>Test Accounts:</p>
        <p style={{ margin: "0" }}>Admin: <code>admin@phillip.com</code> / <code>Admin@123</code></p>
        <p style={{ margin: "0" }}>Student: <code>student@phillip.com</code> / <code>Student@123</code></p>
      </div>
    </div>
  );
}
