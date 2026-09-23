"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function Reports() {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Reports & Analytics</h1>
        <p className="text-gray-600 mb-8 text-sm">View exam statistics and performance data</p>

        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-gray-600">
          <p className="text-base m-0">
            📈 Reports coming soon...
          </p>
          <p className="text-sm mt-2">
            Analytics dashboard will show exam performance, pass rates, and student progress.
          </p>
        </div>
      </div>
    </div>
  );
}
