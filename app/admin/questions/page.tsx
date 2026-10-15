"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminNav from "@/components/AdminNav";

export default function QuestionBank() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session?.user || (session?.user as any)?.role !== "ADMIN") {
      router.push("/login");
      return;
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (status === "unauthenticated" || !session?.user || (session?.user as any)?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">❓ Question Bank</h1>
        <p className="text-gray-600 mb-8 text-sm">Manage exam questions</p>

        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-gray-600">
          <p style={{ margin: "0", fontSize: "16px" }}>
            📝 Question Bank management coming soon...
          </p>
          <p style={{ margin: "10px 0 0 0", fontSize: "14px" }}>
            Questions are currently seeded from the database. You can edit them through the database directly or wait for the UI.
          </p>
        </div>
      </div>
    </div>
  );
}
