"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import StudentNav from "@/components/StudentNav";

const ARROW = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export default function PracticeModePage() {
  const params = useParams<{ paperId: string }>();
  const paperId = params.paperId;

  const options = [
    {
      title: "Full Practice",
      href: `/exam/${paperId}/full-practice`,
      description: "50 questions with no timer and no score. Each answer is marked right or wrong, with its explanation.",
      icon: "M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zm3 4h8M8 12h8M8 16h5",
      cta: "Start full practice",
    },
    {
      title: "Quick Quiz",
      href: `/exam/${paperId}/quick-quiz`,
      description: "Rapid-fire questions across the whole paper, without time limits. Good for quick revision.",
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
      cta: "Start quiz",
    },
    {
      title: "Practice by Chapter",
      href: `/exam/${paperId}/practice-chapter`,
      description: "Pick a chapter and practise its questions with instant feedback, one topic at a time.",
      icon: "M9 4H5a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8.5L9 4z",
      cta: "Choose a chapter",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link href={`/exam/${paperId}`} className="text-sm font-medium text-blue-700 hover:text-blue-800">
          ← Back to modes
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Practice</h1>
        <p className="text-gray-600 mt-1">Choose how you want to practise.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {options.map((opt) => (
            <Link
              key={opt.href}
              href={opt.href}
              className="group bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition duration-300"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-500 transition duration-200">
                <svg className="w-7 h-7 text-blue-600 group-hover:text-white transition duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={opt.icon} />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{opt.title}</h2>
              <p className="text-gray-600 text-sm mb-6">{opt.description}</p>
              <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition duration-200">
                <span>{opt.cta}</span>
                {ARROW}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
