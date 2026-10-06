"use client";

import AdminNav from "@/components/AdminNav";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Paper {
  id: string;
  title: string;
  description?: string;
  externalLink?: string;
  durationMinutes: number;
  totalQuestions: number;
  isAvailable: boolean;
  createdAt: string;
}

export default function PapersListPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchPapers();
    }
  }, [status]);

  const fetchPapers = async () => {
    try {
      const res = await fetch("/api/papers");
      const data = await res.json();
      setPapers(data.papers || []);
    } catch (error) {
      console.error("Error fetching papers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePaper = () => {
    router.push("/admin/papers/new");
  };

  const handlePaperClick = (paperId: string) => {
    router.push(`/admin/papers/${paperId}`);
  };

  const filteredPapers = papers.filter(paper =>
    paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-2">Papers</h1>
          <p className="text-blue-100">Manage all exam papers</p>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search papers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            onClick={handleCreatePaper}
            className="px-6 py-2 bg-amber-500 text-gray-900 font-semibold rounded-lg hover:bg-amber-600 transition"
          >
            + New Paper
          </button>
        </div>

        {/* Papers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredPapers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {papers.length === 0 ? "No papers created yet" : "No papers match your search"}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Paper</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Duration</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Questions</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredPapers.map((paper) => (
                  <tr
                    key={paper.id}
                    onClick={() => handlePaperClick(paper.id)}
                    className="border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{paper.title}</p>
                        {paper.description && (
                          <p className="text-sm text-gray-600">{paper.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {paper.durationMinutes} min
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {paper.totalQuestions}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          paper.isAvailable
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {paper.isAvailable ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(paper.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
