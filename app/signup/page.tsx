"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Paper {
  id: string;
  title: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [selectedPaper, setSelectedPaper] = useState("");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch papers on mount
  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const res = await fetch("/api/papers");
        if (res.ok) {
          const data = await res.json();
          setPapers(data.papers || []);
          // Auto-select first paper
          if (data.papers?.length > 0) {
            setSelectedPaper(data.papers[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch papers:", error);
      }
    };
    fetchPapers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!formData.name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    if (!formData.password.trim()) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!selectedPaper) {
      setError("Please select a paper");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "STUDENT",
          paperId: selectedPaper,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      // Success - redirect to login
      router.push("/login?success=Account created! Please log in.");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "1200px",
        backgroundColor: "white",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: "600px",
        }}>
          {/* Left Panel - Illustration */}
          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "60px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
          }}>
            <div style={{
              textAlign: "center",
            }}>
              <div style={{
                fontSize: "100px",
                marginBottom: "24px",
                lineHeight: "1",
              }}>
                🚀
              </div>
              <h2 style={{
                fontSize: "32px",
                fontWeight: "bold",
                margin: "0 0 16px 0",
              }}>
                Start Your Journey
              </h2>
              <p style={{
                fontSize: "16px",
                lineHeight: "1.6",
                margin: "0 0 40px 0",
                opacity: "0.95",
              }}>
                Join thousands preparing with AI-powered exam coaching
              </p>

              {/* Feature List */}
              <div style={{
                textAlign: "left",
                display: "inline-block",
              }}>
                {[
                  { icon: "🎯", text: "Ace Your CMFAS Exam" },
                  { icon: "📈", text: "Track Your Progress" },
                  { icon: "⚡", text: "Study Smarter" },
                  { icon: "🏆", text: "Achieve Success" },
                ].map((feature, idx) => (
                  <div key={idx} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px",
                    fontSize: "15px",
                  }}>
                    <span style={{ fontSize: "20px" }}>{feature.icon}</span>
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div style={{
            padding: "60px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}>
            {/* Error Message */}
            {error && (
              <div style={{
                backgroundColor: "#fee2e2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px",
                fontWeight: "500",
              }}>
                ❌ {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <h3 style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#1f2937",
                margin: "0 0 24px 0",
              }}>
                Create Account
              </h3>

              {/* Name Input */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1f2937",
                }}>
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  style={{
                    width: "100%",
                    padding: "11px 13px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#3b82f6";
                    e.currentTarget.style.outline = "2px solid rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db";
                    e.currentTarget.style.outline = "none";
                  }}
                />
              </div>

              {/* Email Input */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1f2937",
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  style={{
                    width: "100%",
                    padding: "11px 13px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#3b82f6";
                    e.currentTarget.style.outline = "2px solid rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db";
                    e.currentTarget.style.outline = "none";
                  }}
                />
              </div>

              {/* Password Input */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1f2937",
                }}>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "11px 13px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#3b82f6";
                    e.currentTarget.style.outline = "2px solid rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db";
                    e.currentTarget.style.outline = "none";
                  }}
                />
              </div>

              {/* Confirm Password Input */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1f2937",
                }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "11px 13px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#3b82f6";
                    e.currentTarget.style.outline = "2px solid rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db";
                    e.currentTarget.style.outline = "none";
                  }}
                />
              </div>

              {/* Paper Selection */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1f2937",
                }}>
                  Select Exam Paper
                </label>
                <select
                  value={selectedPaper}
                  onChange={(e) => setSelectedPaper(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 13px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                    cursor: "pointer",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#3b82f6";
                    e.currentTarget.style.outline = "2px solid rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db";
                    e.currentTarget.style.outline = "none";
                  }}
                >
                  <option value="">-- Select a paper --</option>
                  {papers.map((paper) => (
                    <option key={paper.id} value={paper.id}>
                      {paper.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: loading ? "#9ca3af" : "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1d4ed8";
                }}
                onMouseLeave={(e) => {
                  if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2563eb";
                }}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            {/* Login Link */}
            <div style={{
              textAlign: "center",
              marginTop: "24px",
              color: "#6b7280",
              fontSize: "14px",
            }}>
              Already have an account?{" "}
              <Link href="/login" style={{
                color: "#2563eb",
                textDecoration: "none",
                fontWeight: "600",
                cursor: "pointer",
              }}>
                Login here
              </Link>
            </div>

            {/* Back to Home */}
            <div style={{
              textAlign: "center",
              marginTop: "20px",
            }}>
              <div style={{
                color: "#6b7280",
                fontSize: "14px",
                transition: "color 0.2s",
                cursor: "pointer",
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#2563eb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#6b7280";
                }}
              >
                <Link href="/" style={{
                  color: "inherit",
                  textDecoration: "none",
                }}>
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
