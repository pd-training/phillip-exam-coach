"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Paper {
  id: string;
  title: string;
}

// Account creation form, used as the "Create your account" ribbon on the landing page.
export default function SignupForm() {
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

  const inputClass =
    "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900";

  return (
    <div className="w-full bg-white rounded-2xl shadow-xl ring-1 ring-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Start exam prep</h1>
            <p className="mt-1 text-sm text-gray-600">Choose the paper you want to prepare for.</p>
          </div>

          {error && (
            <div role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block mb-1.5 text-sm font-medium text-gray-700">Full name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="email" className="block mb-1.5 text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1.5 text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block mb-1.5 text-sm font-medium text-gray-700">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="paper" className="block mb-1.5 text-sm font-medium text-gray-700">Exam paper</label>
            <select
              id="paper"
              value={selectedPaper}
              onChange={(e) => setSelectedPaper(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a paper</option>
              {papers.map((paper) => (
                <option key={paper.id} value={paper.id}>
                  {paper.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? "Starting..." : "Start learning"}
          </button>
        </form>
    </div>
  );
}
