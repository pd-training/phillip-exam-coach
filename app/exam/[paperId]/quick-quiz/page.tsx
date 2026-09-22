"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import StudentNav from "@/components/StudentNav";

interface Question {
  id: string;
  text: string;
  chapter: number;
}

interface Feedback {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  studentAnswer: string;
}

export default function QuickQuizMode() {
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
      const res = await fetch(`/api/papers/${paperId}/practice/quick-quiz`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
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
      setCompleted(true);
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading quiz...</div>;

  if (completed) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <StudentNav />

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-2xl text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">🎉 Quiz Complete!</h1>
            
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 mb-8">
              <p className="text-5xl font-bold text-green-600 mb-3">{percentage}%</p>
              <p className="text-gray-700 font-medium">
                {score} out of {questions.length} correct
              </p>
            </div>

            <button
              onClick={() => router.back()}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              Back to Practice
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQIndex];
  const progress = currentQIndex + 1;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <StudentNav />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-2xl">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Quick Quiz</h1>
            <div className="text-sm font-medium text-gray-600">
              Question <span className="text-blue-600 font-bold">{progress}</span> of <span className="text-gray-900 font-bold">{questions.length}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
            <div
          style={{
            height: "100%",
            width: `${(progress / questions.length) * 100}%`,
            backgroundColor: "#3b82f6",
            transition: "width 0.3s",
          }}
        />
      </div>

      {/* Question */}
      <div
        style={{
          padding: "20px",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #e5e7eb",
        }}
      >
        <p style={{ margin: "0", fontWeight: "500", fontSize: "16px", lineHeight: "1.5" }}>
          {currentQuestion.text}
        </p>
        <p style={{ margin: "10px 0 0 0", fontSize: "12px", color: "#999" }}>
          Chapter {currentQuestion.chapter}
        </p>
      </div>

      {/* Answer options */}
      <div style={{ marginBottom: "20px" }}>
        {["A", "B", "C", "D"].map((option) => (
          <label
            key={option}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px",
              marginBottom: "10px",
              backgroundColor:
                selectedAnswer === option ? "#dbeafe" : "white",
              border:
                selectedAnswer === option
                  ? "2px solid #3b82f6"
                  : "1px solid #e5e7eb",
              borderRadius: "6px",
              cursor: showingFeedback ? "not-allowed" : "pointer",
              opacity: showingFeedback && selectedAnswer !== option ? 0.6 : 1,
            }}
          >
            <input
              type="radio"
              name="answer"
              value={option}
              checked={selectedAnswer === option}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              disabled={showingFeedback}
              style={{ marginRight: "12px" }}
            />
            <span style={{ fontWeight: "500" }}>{option}</span>
          </label>
        ))}
      </div>

      {/* Feedback */}
      {showingFeedback && feedback && (
        <div
          style={{
            padding: "15px",
            marginBottom: "20px",
            backgroundColor: feedback.isCorrect ? "#dcfce7" : "#fee2e2",
            borderRadius: "6px",
            borderLeft: `4px solid ${feedback.isCorrect ? "#22c55e" : "#ef4444"}`,
          }}
        >
          <p
            style={{
              margin: "0 0 10px 0",
              fontWeight: "600",
              color: feedback.isCorrect ? "#166534" : "#991b1b",
            }}
          >
            {feedback.isCorrect ? "✓ Correct!" : "✗ Incorrect"}
          </p>
          {!feedback.isCorrect && (
            <p style={{ margin: "0 0 10px 0", fontSize: "14px" }}>
              Correct answer: <strong>{feedback.correctAnswer}</strong>
            </p>
          )}
          <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.5" }}>
            {feedback.explanation}
          </p>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={() => router.back()}
          style={{
            flex: 1,
            padding: "12px",
            backgroundColor: "#e5e7eb",
            color: "#1f2937",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Back
        </button>
        {!showingFeedback ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer}
            style={{
              flex: 1,
              padding: "12px",
              backgroundColor:
                selectedAnswer ? "#3b82f6" : "#9ca3af",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: selectedAnswer ? "pointer" : "not-allowed",
              fontWeight: "600",
            }}
          >
            Submit
          </button>
        ) : (
          <button
            onClick={handleNext}
            style={{
              flex: 1,
              padding: "12px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            {currentQIndex < questions.length - 1 ? "Next Question" : "See Results"}
          </button>
        )}
      </div>

      {/* Score tracker */}
      <div
        style={{
          marginTop: "20px",
          padding: "12px",
          backgroundColor: "#f0f9ff",
          borderRadius: "6px",
          textAlign: "center",
          fontSize: "14px",
        }}
      >
        Correct so far: {score} / {answered}
      </div>
    </div>
  );
}
