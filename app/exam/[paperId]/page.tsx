"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface Question {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
}

interface Paper {
  id: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  questions: Question[];
}

export default function ExamPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const params = useParams();
  const paperId = params.paperId as string;

  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Handle auth redirects
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
  }, [status, router]);

  if (status === "loading") {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  useEffect(() => {
    fetchPaper();
  }, [paperId]);

  useEffect(() => {
    if (!paper || submitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paper, submitted]);

  const fetchPaper = async () => {
    try {
      const res = await fetch(`/api/papers/${paperId}`);
      if (res.ok) {
        const data = await res.json();
        setPaper(data.paper);
        setTimeLeft(data.paper.durationMinutes * 60);
      }
    } catch (error) {
      console.error("Failed to fetch paper:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    if (!paper) return;

    // Calculate score
    let correctCount = 0;
    paper.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const percentage = (correctCount / paper.questions.length) * 100;
    setScore(percentage);
    setSubmitted(true);
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading exam...</div>;
  }

  if (!paper) {
    return <div style={{ padding: "20px" }}>Exam not found</div>;
  }

  if (submitted) {
    const correctCount = Math.round((score / 100) * paper.questions.length);
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>
            {score >= 70 ? "🎉" : "📊"}
          </div>
          <h1 style={{ margin: "0 0 20px 0" }}>Exam Submitted</h1>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "#0070f3", margin: "0 0 10px 0" }}>
            Score: {score.toFixed(1)}%
          </p>
          <p style={{ color: "#666", margin: "0 0 30px 0" }}>
            {correctCount} out of {paper.questions.length} questions correct
          </p>
          <div style={{
            backgroundColor: score >= 70 ? "#d1fae5" : "#fee2e2",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "30px",
            color: score >= 70 ? "#065f46" : "#991b1b",
          }}>
            <p style={{ margin: "0" }}>
              {score >= 70 ? "✅ You passed!" : "❌ You did not pass. Try again!"}
            </p>
          </div>
          <a href="/dashboard">
            <button style={{
              padding: "10px 24px",
              backgroundColor: "#1f2937",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
            }}>
              Back to Dashboard
            </button>
          </a>
        </div>
      </div>
    );
  }

  const currentQuestion = paper.questions[currentQuestionIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const optionLetters = ["A", "B", "C", "D"];
  const options = [
    currentQuestion.optionA,
    currentQuestion.optionB,
    currentQuestion.optionC,
    currentQuestion.optionD,
  ];

  return (
    <div style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", padding: "20px" }}>
      {/* Header */}
      <div style={{
        backgroundColor: "white",
        padding: "16px 24px",
        borderRadius: "12px",
        marginBottom: "24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <div>
          <h2 style={{ margin: "0" }}>{paper.title}</h2>
          <p style={{ margin: "4px 0 0 0", color: "#666", fontSize: "14px" }}>
            Question {currentQuestionIndex + 1} of {paper.questions.length}
          </p>
        </div>
        <div style={{
          fontSize: "32px",
          fontWeight: "bold",
          color: timeLeft < 300 ? "#ef4444" : "#1f2937",
        }}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      {/* Question Container */}
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{
          backgroundColor: "white",
          padding: "32px",
          borderRadius: "12px",
          marginBottom: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <h3 style={{ marginTop: "0", marginBottom: "24px", fontSize: "18px" }}>
            {currentQuestion.questionText}
          </h3>

          {/* Options */}
          <div style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
            {options.map((option, idx) => (
              <label
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  padding: "16px",
                  border: `2px solid ${answers[currentQuestion.id] === optionLetters[idx] ? "#3b82f6" : "#e5e7eb"}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: answers[currentQuestion.id] === optionLetters[idx] ? "#eff6ff" : "white",
                  transition: "all 0.2s",
                }}
              >
                <input
                  type="radio"
                  name="answer"
                  value={optionLetters[idx]}
                  checked={answers[currentQuestion.id] === optionLetters[idx]}
                  onChange={() => handleAnswerChange(currentQuestion.id, optionLetters[idx])}
                  style={{ marginRight: "12px", marginTop: "2px", cursor: "pointer" }}
                />
                <div>
                  <span style={{ fontWeight: "600", marginRight: "8px" }}>
                    {optionLetters[idx]}.
                  </span>
                  <span>{option}</span>
                </div>
              </label>
            ))}
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{
              height: "8px",
              backgroundColor: "#e5e7eb",
              borderRadius: "4px",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                backgroundColor: "#3b82f6",
                width: `${((currentQuestionIndex + 1) / paper.questions.length) * 100}%`,
                transition: "width 0.3s",
              }} />
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              style={{
                padding: "10px 24px",
                backgroundColor: currentQuestionIndex === 0 ? "#d1d5db" : "#f3f4f6",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: currentQuestionIndex === 0 ? "not-allowed" : "pointer",
                fontWeight: "600",
              }}
            >
              ← Previous
            </button>

            {currentQuestionIndex === paper.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Submit Exam
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(Math.min(paper.questions.length - 1, currentQuestionIndex + 1))}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Next →
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <p style={{ margin: "0 0 12px 0", fontSize: "12px", fontWeight: "600", color: "#666" }}>
            QUICK NAVIGATION
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))", gap: "6px" }}>
            {paper.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                style={{
                  width: "40px",
                  height: "40px",
                  padding: "0",
                  backgroundColor:
                    idx === currentQuestionIndex
                      ? "#3b82f6"
                      : answers[q.id]
                      ? "#d1fae5"
                      : "#f3f4f6",
                  color: idx === currentQuestionIndex ? "white" : "#1f2937",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "12px",
                }}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
