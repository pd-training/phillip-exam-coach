"use client";

import { useState, useEffect } from "react";
import { buildOptions, displayLabel } from "@/lib/option-order";
import { useOptionOrder } from "@/lib/use-option-order";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import StudentNav from "@/components/StudentNav";

// Add animation styles
const styles = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

interface Chapter {
  number: number;
  title: string;
}

interface Question {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

interface Feedback {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  studentAnswer: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

export default function PracticeChapterMode() {
  const orderFor = useOptionOrder();
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const paperId = params.paperId as string;

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showingFeedback, setShowingFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [paperTitle, setPaperTitle] = useState<string>("");
  const [paperDescription, setPaperDescription] = useState<string>("");

  // Auth check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch chapters
  useEffect(() => {
    if (!paperId) return;
    fetchChapters();
  }, [paperId]);

  const fetchChapters = async () => {
    try {
      const res = await fetch(`/api/papers/${paperId}/practice/chapters`);
      if (res.ok) {
        const data = await res.json();
        setChapters(data.chapters);
        setPaperTitle(data.paperTitle || "Practice Chapter");
        setPaperDescription(data.paperDescription || "");
      }
    } catch (error) {
      console.error("Fetch chapters error:", error);
      alert("Failed to load chapters");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChapter = async (chapterNum: number) => {
    setSelectedChapter(chapterNum);
    setCurrentQIndex(0);
    setScore(0);
    setAnswered(0);
    setSelectedAnswer("");
    setFeedback(null);
    setShowingFeedback(false);

    try {
      const res = await fetch(
        `/api/papers/${paperId}/practice/chapters/${chapterNum}`
      );
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error("Fetch chapter questions error:", error);
      alert("Failed to load chapter questions");
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) {
      alert("Please select an answer");
      return;
    }

    try {
      const res = await fetch(
        `/api/papers/${paperId}/practice/chapters/${selectedChapter}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: questions[currentQIndex].id,
            answer: selectedAnswer,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setFeedback(data);
        setShowingFeedback(true);
        if (data.isCorrect) {
          setScore(score + 1);
        }
        setAnswered(answered + 1);
      }
    } catch (error) {
      console.error("Submit answer error:", error);
      alert("Error submitting answer");
    }
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
      setSelectedAnswer("");
      setFeedback(null);
      setShowingFeedback(false);
    } else {
      setSelectedChapter(null);
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading chapters...</div>;

  // Chapter selection view
  if (selectedChapter === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <StudentNav />

        <div className="flex-1 w-full">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              ← Back
            </button>

            <div className="mt-6">
              <h1 className="text-2xl font-bold text-gray-900">{paperTitle} - Practice by Chapter</h1>
              <p className="text-sm text-gray-600 mt-1">
                Select a chapter to practice 10 random questions with instant feedback.
              </p>
            </div>

            {chapters.length === 0 ? (
              <p className="mt-8 text-gray-600 text-sm">No chapters are available for this paper yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
                {chapters.map((ch) => (
                  <button
                    key={ch.number}
                    onClick={() => router.push(`/exam/${paperId}/practice-chapter/${ch.number}`)}
                    className="group flex items-center gap-4 bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-5 text-left hover:shadow-md hover:border-blue-300 transition duration-200"
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition duration-200">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                        />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-gray-900 leading-snug">
                      Chapter {ch.number} - {ch.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Question drill view
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <StudentNav />
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const currentQuestion = questions[currentQIndex];
  const progress = currentQIndex + 1;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <style>{styles}</style>
      <StudentNav />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-2xl">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">{paperTitle}</p>
              <h1 className="text-2xl font-bold text-gray-900">
                Chapter {selectedChapter}
              </h1>
            </div>
            <div className="text-sm font-medium text-gray-600">
              Question <span className="text-blue-600 font-bold">{progress}</span> of <span className="text-gray-900 font-bold">{questions.length}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(progress / questions.length) * 100}%` }}
            />
          </div>

          {/* Question */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <p className="m-0 font-medium text-lg leading-relaxed text-gray-900">
              {currentQuestion.text}
            </p>
          </div>

          {/* Answer options */}
          <div className="space-y-3 mb-8">
            {buildOptions(currentQuestion, orderFor(currentQuestion.id)).map((option) => (
              <label
                key={option.key}
                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition duration-200 ${
                  selectedAnswer === option.key
                    ? "bg-blue-50 border-blue-500"
                    : "bg-white border-gray-200 hover:border-gray-300"
                } ${showingFeedback && selectedAnswer !== option.key ? "opacity-50" : "opacity-100"}`}
              >
                <input
                  type="radio"
                  name="answer"
                  value={option.key}
                  checked={selectedAnswer === option.key}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  disabled={showingFeedback}
                  className="mr-4 w-4 h-4"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900 mr-3">{option.label}.</span>
                  <span className="text-gray-700">{option.text}</span>
                </div>
              </label>
            ))}
          </div>

          {/* Feedback Modal */}
          {showingFeedback && feedback && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "20px",
              }}
            >
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "32px",
                  maxWidth: "500px",
                  width: "100%",
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                  animation: "slideUp 0.3s ease-out",
                }}
              >
                {/* Header with Icon */}
                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      backgroundColor: feedback.isCorrect ? "#dcfce7" : "#fee2e2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                      fontSize: "28px",
                    }}
                  >
                    {feedback.isCorrect ? "✓" : "✕"}
                  </div>
                  <h2
                    style={{
                      margin: "0",
                      fontSize: "24px",
                      fontWeight: "700",
                      color: feedback.isCorrect ? "#166534" : "#991b1b",
                    }}
                  >
                    {feedback.isCorrect ? "Correct!" : "Incorrect"}
                  </h2>
                </div>

                {/* Correct answer */}
                <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #e5e7eb" }}>
                  <p style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Correct answer
                  </p>
                  <p style={{ margin: "0", fontSize: "15px", color: "#1f2937" }}>
                    <strong>{displayLabel(orderFor(currentQuestion.id), feedback.correctAnswer)}.</strong> {
                      feedback.correctAnswer === "A" ? feedback.optionA :
                      feedback.correctAnswer === "B" ? feedback.optionB :
                      feedback.correctAnswer === "C" ? feedback.optionC :
                      feedback.optionD
                    }
                  </p>
                </div>

                {/* Explanation */}
                <div style={{ marginBottom: "24px" }}>
                  <p style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Explanation
                  </p>
                  <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#374151" }}>
                    {feedback.explanation}
                  </p>
                </div>

                {/* Continue Button */}
                <button
                  onClick={handleNext}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#1e3a8a",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "15px",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = "#1e40af";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = "#1e3a8a";
                  }}
                >
                  {currentQIndex < questions.length - 1 ? "Next Question" : "Back to Chapters"}
                </button>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setSelectedChapter(null)}
              disabled={showingFeedback}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: showingFeedback ? "#d1d5db" : "#e5e7eb",
                color: "#1f2937",
                border: "none",
                borderRadius: "6px",
                cursor: showingFeedback ? "not-allowed" : "pointer",
                fontWeight: "600",
                opacity: showingFeedback ? 0.6 : 1,
              }}
            >
              Back to Chapters
            </button>
            {!showingFeedback && (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor:
                    selectedAnswer ? "#1e3a8a" : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: selectedAnswer ? "pointer" : "not-allowed",
                  fontWeight: "600",
                  transition: "all 0.2s",
                }}
              >
                Submit
              </button>
            )}
          </div>

          {/* Score tracker */}
          <div className="mt-5 p-3 bg-blue-50 rounded text-center text-sm text-blue-900 font-medium">
            Correct so far: {score} / {answered}
          </div>
        </div>
      </div>
    </div>
  );
}
