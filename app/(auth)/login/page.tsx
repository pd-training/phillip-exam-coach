import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex flex-col items-center mb-8 group">
        <span className="flex items-center justify-center w-14 h-14 rounded-xl bg-amber-400 text-blue-900 text-xl font-extrabold shadow-lg group-hover:scale-105 transition">
          FR
        </span>
        <span className="mt-4 text-2xl font-bold text-white tracking-tight">FinanceReady</span>
        <span className="mt-1 text-sm text-blue-200">CMFAS exam preparation for financial advisers</span>
      </Link>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <Suspense fallback={<p className="text-center text-sm text-gray-600">Loading...</p>}>
          <LoginForm />
        </Suspense>
      </div>

      <p className="mt-6 text-sm text-blue-200">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-white underline underline-offset-4 hover:text-amber-300">
          Create an account
        </Link>
      </p>
    </div>
  );
}
