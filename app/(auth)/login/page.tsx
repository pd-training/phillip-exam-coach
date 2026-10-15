import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 text-2xl font-bold text-blue-900 tracking-tight">
        FinanceReady
      </Link>

      <div className="w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <Suspense fallback={<p className="text-center text-sm text-gray-600">Loading...</p>}>
          <LoginForm />
        </Suspense>
      </div>

      <p className="mt-6 text-sm text-gray-600">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-blue-900 hover:text-blue-800">
          Create an account
        </Link>
      </p>
    </div>
  );
}
