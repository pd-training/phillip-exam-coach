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

interface Question {
  id: string;
  text: string;
  chapter: number;
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

export default function QuickQuizMode() {
  const orderFor = useOptionOrder();
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const paperId = params.paperId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showingFeedback, setShowingFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [paperTitle, setPaperTitle] = useState<string>("");
  // Questions answered incorrectly in the current run, used for "Practise what I got wrong"
  const [missed, setMissed] = useState<Question[]>([]);
  // Every answer in the current run, saved to the student's progress when the quiz finishes
  const [sessionAnswers, setSessionAnswers] = useState<{ questionId: string; answer: string }[]>([]);

  // Auth check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch quiz
  useEffect(() => {
    if (!paperId) return;
    fetchQuiz();
  }, [paperId]);

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`/api/papers/${paperId}/practice/quick-quiz?count=50`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
        setPaperTitle(data.paperTitle || "Quick Quiz");
      }
    } catch (error) {
      console.error("Fetch quiz error:", error);
      alert("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) {
      alert("Please select an answer");
      return;
    }

    try {
      const res = await fetch(`/api/papers/${paperId}/practice/quick-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: questions[currentQIndex].id,
          answer: selectedAnswer,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFeedback(data);
        setShowingFeedback(true);
        if (data.isCorrect) {
          setScore(score + 1);
        } else {
          setMissed((prev) => [...prev, questions[currentQIndex]]);
        }
        setSessionAnswers((prev) => [...prev, { questionId: questions[currentQIndex].id, answer: selectedAnswer }]);
        setAnswered(answered + 1);
      }
    } catch (error) {
      console.error("Submit answer error:", error);
      alert("Error submitting answer");
    }
  };

  const handlePrevious = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(currentQIndex - 1);
      setSelectedAnswer("");
      setFeedback(null);
      setShowingFeedback(false);
    }
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
      setSelectedAnswer("");
      setFeedback(null);
      setShowingFeedback(false);
    } else {
      setCompleted(true);
      saveRun(sessionAnswers);
    }
  };

  const saveSession = (answers: { questionId: string; answer: string }[]) => {
    if (answers.length === 0) return;
    fetch("/api/student/quick-quiz-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperId, answers }),
    }).catch((error) => console.error("Save quiz error:", error));
  };

  // Saves the finished run so it appears in Progress under Practice Sessions
  const saveRun = (answers: { questionId: string; answer: string }[]) => {
    if (answers.length === 0) return;
    fetch("/api/student/quick-quiz-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperId, mode: "full", answers }),
    }).catch((error) => console.error("Save full practice error:", error));
  };

  const handleRetryQuiz = () => {
    // Reset all quiz state
    setCurrentQIndex(0);
    setSelectedAnswer("");
    setFeedback(null);
    setShowingFeedback(false);
    setScore(0);
    setAnswered(0);
    setCompleted(false);
    setMissed([]);
    setSessionAnswers([]);
  };

  // Run again using only the questions answered incorrectly in the last run
  const handlePractiseMissed = () => {
    setQuestions(missed);
    setCurrentQIndex(0);
    setSelectedAnswer("");
    setFeedback(null);
    setShowingFeedback(false);
    setScore(0);
    setAnswered(0);
    setCompleted(false);
    setMissed([]);
    setSessionAnswers([]);
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading quiz...</div>;

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <StudentNav />

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-2xl text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Full Practice complete</h1>
            <p className="text-gray-600 mb-8">You have worked through all {questions.length} questions.</p>
            <div className="flex gap-3">
              <button
                onClick={() => router.replace(`/exam/${paperId}`)}
                className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition duration-200"
              >
                Back to Paper
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold transition duration-200"
              >
                Start again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQIndex];
  const progress = currentQIndex + 1;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <style>{styles}</style>
      <StudentNav />

      <div className="flex-1 flex justify-center px-6 py-6">
        <div className="w-full max-w-4xl">
          {/* Back to Practice Link */}
          <button
            onClick={() => router.replace(`/exam/${paperId}`)}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-6 transition duration-200 flex items-center gap-2"
          >
            ← Back to Paper
          </button>

          {/* Header */}
          <div className="mb-5 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-600 mb-1">{paperTitle}</p>
              <h1 className="text-2xl font-bold text-gray-900">Full Practice</h1>
            </div>
            <div className="text-sm font-medium text-gray-600">
              Question <span className="text-blue-600 font-bold">{progress}</span> of <span className="text-gray-900 font-bold">{questions.length}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full mb-5 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{
                width: `${(progress / questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Question */}
          <div style={{ marginBottom: "14px" }}>
            <p style={{ whiteSpace: "pre-line", margin: "0", fontWeight: "500", fontSize: "15px", lineHeight: "1.5" }}>
              {currentQuestion.text}
            </p>
            <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "#999" }}>
              Chapter {currentQuestion.chapter}
            </p>
          </div>

          {/* Answer options */}
          <div style={{ marginBottom: "14px" }}>
            {buildOptions(currentQuestion, orderFor(currentQuestion.id)).map((option) => (
              <label
                key={option.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 10px",
                  marginBottom: "6px",
                  fontSize: "14px",
                  backgroundColor:
                    selectedAnswer === option.key ? "#eff6ff" : "white",
                  border:
                    selectedAnswer === option.key
                      ? "2px solid #3b82f6"
                      : "1px solid #e5e7eb",
                  borderRadius: "6px",
                  cursor: showingFeedback ? "not-allowed" : "pointer",
                  opacity: showingFeedback && selectedAnswer !== option.key ? 0.6 : 1,
                  transition: "all 0.2s",
                }}
              >
                <input
                  type="radio"
                  name="answer"
                  value={option.key}
                  checked={selectedAnswer === option.key}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  disabled={showingFeedback}
                  style={{ marginRight: "12px" }}
                />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: "500", marginRight: "8px" }}>{option.label}.</span>
                  <span>{option.text}</span>
                </div>
              </label>
            ))}
          </div>

          {/* Feedback, shown on the page below the options */}
          {showingFeedback && feedback && (
            <div style={{ marginTop: "14px" }}>
              <div
                style={{
                  backgroundColor: feedback.isCorrect ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${feedback.isCorrect ? "#bbf7d0" : "#fecaca"}`,
                  borderRadius: "10px",
                  padding: "14px 16px",
                }}
              >
                {/* Header with Icon */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      flexShrink: 0,
                      borderRadius: "50%",
                      backgroundColor: feedback.isCorrect ? "#dcfce7" : "#fee2e2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                    }}
                  >
                    {feedback.isCorrect ? "✓" : "✕"}
                  </div>
                  <h2
                    style={{
                      margin: "0",
                      fontSize: "18px",
                      fontWeight: "700",
                      color: feedback.isCorrect ? "#166534" : "#991b1b",
                    }}
                  >
                    {feedback.isCorrect ? "Correct!" : "Incorrect"}
                  </h2>
                </div>

                {/* Correct answer */}
                <div style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #e5e7eb" }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Correct answer
                  </p>
                  <p style={{ margin: "0", fontSize: "14px", color: "#1f2937" }}>
                    <strong>{displayLabel(orderFor(currentQuestion.id), feedback.correctAnswer)}.</strong> {
                      feedback.correctAnswer === "A" ? feedback.optionA :
                      feedback.correctAnswer === "B" ? feedback.optionB :
                      feedback.correctAnswer === "C" ? feedback.optionC :
                      feedback.optionD
                    }
                  </p>
                </div>

                {/* Explanation */}
                <div style={{ marginBottom: "12px" }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Explanation
                  </p>
                  <p style={{ whiteSpace: "pre-line", margin: "0", fontSize: "13px", lineHeight: "1.5", color: "#374151" }}>
                    {feedback.explanation}
                  </p>
                </div>

                {/* Continue Button */}
                <button
                  onClick={handleNext}
                  style={{
                    width: "100%",
                    padding: "9px",
                    backgroundColor: "#1e3a8a",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = "#1e40af";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = "#1e3a8a";
                  }}
                >
                  {currentQIndex < questions.length - 1 ? "Next Question" : "See Results"}
                </button>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handlePrevious}
              disabled={currentQIndex === 0 || showingFeedback}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: (currentQIndex === 0 || showingFeedback) ? "#d1d5db" : "#e5e7eb",
                color: "#1f2937",
                border: "none",
                borderRadius: "6px",
                cursor: (currentQIndex === 0 || showingFeedback) ? "not-allowed" : "pointer",
                fontWeight: "600",
                opacity: (currentQIndex === 0 || showingFeedback) ? 0.6 : 1,
              }}
            >
              ← Back
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

        </div>
      </div>
    </div>
  );
}
