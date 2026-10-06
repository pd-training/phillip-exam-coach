"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

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

  // Fetch available papers (papers with questions) on mount
  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const res = await fetch("/api/papers/available");
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
      const payloadData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: "STUDENT",
        paperId: selectedPaper,
      };
      console.log("Signup payload:", payloadData);

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadData),
      });

      const data = await res.json();
      console.log("Signup response:", data);
      if (!data.paperAssignmentSuccess && data.paperAssignmentError) {
        console.error("Paper assignment error:", data.paperAssignmentError);
      }

      if (!res.ok) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-5">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">📊</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Finance Ready</span>
          </Link>
          <Link href="/">
            <button className="text-gray-600 hover:text-gray-900 font-medium transition">
              ← Back to Home
            </button>
          </Link>
        </div>
      </div>

      <div className="w-full max-w-5xl mt-20">
        <div className="grid md:grid-cols-2 gap-0 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          {/* Left Panel - Illustration */}
          <div className="hidden md:flex bg-gradient-to-br from-blue-600 to-blue-700 p-12 flex-col justify-center items-center text-white">
            <div className="text-center">
              <div className="text-8xl mb-6 leading-none">🚀</div>
              <h2 className="text-4xl font-bold mb-4">Start Your Journey</h2>
              <p className="text-blue-100 mb-8 text-lg">Join thousands preparing with AI-powered exam coaching</p>

              {/* Feature List */}
              <div className="space-y-4 text-left inline-block">
                {[
                  { icon: "🎯", text: "Ace Your CMFAS Exam" },
                  { icon: "📈", text: "Track Your Progress" },
                  { icon: "⚡", text: "Study Smarter" },
                  { icon: "🏆", text: "Achieve Success" },
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-blue-50">
                    <span className="text-2xl">{feature.icon}</span>
                    <span className="text-base">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
                ❌ {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h3>

              {/* Name Input */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition"
                />
              </div>

              {/* Email Input */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition"
                />
              </div>

              {/* Password Input */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition"
                />
              </div>

              {/* Confirm Password Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition"
                />
              </div>

              {/* Paper Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Select Exam Paper</label>
                <select
                  value={selectedPaper}
                  onChange={(e) => setSelectedPaper(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition cursor-pointer"
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
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center mt-6 text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition">
                Login here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
