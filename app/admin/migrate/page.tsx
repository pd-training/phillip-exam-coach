"use client";

import AdminNav from "@/components/AdminNav";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function MigratePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleMigrateExamParts = async () => {
    if (!confirm("This will create default exam parts for all papers without exam parts. Continue?")) {
      return;
    }

    try {
      setRunning(true);
      setError("");
      setResult(null);

      const res = await fetch("/api/admin/migrate/exam-parts", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Migration failed");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  };

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push("/admin/papers")}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
          >
            ← Back to Papers
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Admin Migrations</h1>
          <p className="text-gray-600 mt-1">Run data migrations for system updates</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Create Default Exam Parts</h2>
          <p className="text-gray-600 mb-4">
            Papers created before the recent update don't have default exam parts. This migration will create a "Full Exam" part for any paper that's missing exam parts.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            • Existing papers with exam parts: skipped<br/>
            • New papers: already have default part
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
              Error: {error}
            </div>
          )}

          {result && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <p className="text-green-700 font-semibold mb-2">{result.message}</p>
              <div className="text-sm text-green-600 space-y-1">
                <p>📊 Total papers: {result.totalPapers}</p>
                <p>✅ Created: {result.created}</p>
                <p>⏭️ Skipped: {result.skipped}</p>
              </div>
              {result.details && result.details.length > 0 && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-sm font-medium text-green-700 mb-2">Details:</p>
                  <div className="text-xs text-green-600 space-y-1 max-h-48 overflow-y-auto">
                    {result.details.map((detail: any, idx: number) => (
                      <div key={idx}>
                        {detail.paperId.substring(0, 8)}... - {detail.status}
                        {detail.questionCount && ` (${detail.questionCount} questions)`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleMigrateExamParts}
            disabled={running}
            className="px-6 py-2 bg-amber-500 text-gray-900 font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50 transition"
          >
            {running ? "Running..." : "Run Migration"}
          </button>
        </div>
      </div>
    </div>
  );
}
