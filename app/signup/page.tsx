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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-50 to-slate-50 flex items-center justify-center p-5">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-blue-900/95 backdrop-blur-sm border-b border-blue-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="font-bold text-xl text-white">Finance<span className="text-amber-400">Ready</span></span>
          </Link>
          <Link href="/">
            <button className="text-blue-200 hover:text-amber-400 font-medium transition">
              ← Back to Home
            </button>
          </Link>
        </div>
      </div>

      <div className="w-full max-w-5xl mt-20">
        <div className="grid md:grid-cols-2 gap-0 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          {/* Left Panel - Value Proposition */}
          <div className="hidden md:flex bg-gradient-to-br from-blue-900 to-blue-800 p-12 flex-col justify-center items-start text-white">
            <div>
              <h2 className="text-5xl font-bold mb-6 leading-tight">Exam Ready</h2>
              <p className="text-blue-100 mb-12 text-lg leading-relaxed max-w-sm">
                Master the CMFAS certification with comprehensive practice papers, detailed performance tracking, and expert-curated study materials.
              </p>

              {/* Key Benefits - Text Only */}
              <div className="space-y-6">
                <div>
                  <p className="text-amber-300 font-semibold mb-2">Real Exam Experience</p>
                  <p className="text-blue-100 text-sm leading-relaxed">Full mock papers designed with authentic difficulty and realistic timing constraints</p>
                </div>
                <div>
                  <p className="text-amber-300 font-semibold mb-2">Performance Insights</p>
                  <p className="text-blue-100 text-sm leading-relaxed">Track your progress with detailed analytics to identify and strengthen weak areas</p>
                </div>
                <div>
                  <p className="text-amber-300 font-semibold mb-2">Personalized Learning</p>
                  <p className="text-blue-100 text-sm leading-relaxed">Study recommendations tailored to your performance patterns and learning pace</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
                {error}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>

              {/* Paper Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Select Exam Paper</label>
                <select
                  value={selectedPaper}
                  onChange={(e) => setSelectedPaper(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition cursor-pointer"
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
                className="w-full bg-amber-500 hover:bg-amber-600 text-blue-900 font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center mt-6 text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-amber-500 font-semibold hover:text-amber-600 transition">
                Login here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
