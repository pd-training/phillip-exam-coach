"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

interface Question {
  id: string;
  text: string;
}

interface ExamPart {
  id: string;
  partName: string;
  questionCount: number;
  passingScore: number;
  questions: Question[];
}

interface ExamConfig {
  totalTime: number;
  passingScore: number;
}

export default function FullExamMode() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const paperId = params.paperId as string;

  const [examConfig, setExamConfig] = useState<ExamConfig | null>(null);
  const [parts, setParts] = useState<ExamPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Auth check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch exam
  useEffect(() => {
    if (!paperId) return;
    fetchExam();
  }, [paperId]);

  const fetchExam = async () => {
    try {
      const res = await fetch(`/api/papers/${paperId}/practice/full-exam`);
      if (res.ok) {
        const data = await res.json();
        setExamConfig(data.examConfig);
        setParts(data.parts);
        setTimeLeft(data.examConfig.totalTime * 60); // Convert to seconds
      }
    } catch (error) {
      console.error("Fetch exam error:", error);
      alert("Failed to load exam");
    } finally {
      setLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (!submitted && timeLeft <= 0 && examConfig) {
      handleSubmit();
      return;
    }

    if (submitted || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, submitted, examConfig]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/papers/${paperId}/practice/full-exam`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (session?.user as any)?.id,
          answers,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setSubmitted(true);
      } else {
        alert("Failed to submit exam");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Error submitting exam");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading exam...</div>;

  if (submitted && result) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
        <h1>Exam Results</h1>
        <div
          style={{
            padding: "20px",
            backgroundColor: result.passed ? "#dcfce7" : "#fee2e2",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: "0 0 10px 0" }}>
            {result.passed ? "✅ Passed" : "❌ Did Not Pass"}
          </h2>
          <p style={{ margin: "0 0 10px 0", fontSize: "24px", fontWeight: "bold" }}>
            Score: {result.score}%
          </p>
          <p style={{ margin: "0" }}>
            {result.correctCount} out of {result.totalQuestions} correct
          </p>
          <p style={{ margin: "10px 0 0 0", fontSize: "14px" }}>
            Passing score: {result.passingScore}%
          </p>
        </div>

        <div>
          <h3>Review Answers</h3>
          {result.answers.map((answer: any, idx: number) => (
            <div
              key={answer.questionId}
              style={{
                padding: "15px",
                marginBottom: "10px",
                backgroundColor: answer.isCorrect ? "#f0fdf4" : "#fef2f2",
                borderLeft: `4px solid ${answer.isCorrect ? "#22c55e" : "#ef4444"}`,
                borderRadius: "4px",
              }}
            >
              <p style={{ margin: "0 0 8px 0", fontWeight: "600" }}>
                Q{idx + 1}: {answer.isCorrect ? "✓ Correct" : "✗ Incorrect"}
              </p>
              <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
                Your answer: {answer.studentAnswer}
              </p>
              {!answer.isCorrect && (
                <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#059669" }}>
                  Correct answer: {answer.correctAnswer}
                </p>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => router.back()}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Back to Practice
        </button>
      </div>
    );
  }

  const totalQuestions = parts.reduce((sum, p) => sum + p.questions.length, 0);
  const answeredCount = Object.keys(answers).length;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          paddingBottom: "20px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <h1 style={{ margin: "0" }}>Full Exam Mode</h1>
        <div
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: timeLeft < 300 ? "#ef4444" : "#3b82f6",
          }}
        >
          Time: {formatTime(timeLeft)}
        </div>
      </div>

      <div style={{ marginBottom: "20px", fontSize: "14px", color: "#666" }}>
        Progress: {answeredCount} / {totalQuestions} answered
      </div>

      {parts.map((part) => (
        <div key={part.id} style={{ marginBottom: "30px" }}>
          <h2 style={{ marginBottom: "15px", fontSize: "18px" }}>
            {part.partName} ({part.questions.length} questions) - {part.passingScore}% to pass
          </h2>

          {part.questions.map((question, idx) => (
            <div
              key={question.id}
              style={{
                padding: "15px",
                marginBottom: "15px",
                backgroundColor: "#f9fafb",
                borderRadius: "6px",
                border: "1px solid #e5e7eb",
              }}
            >
              <p style={{ margin: "0 0 12px 0", fontWeight: "500" }}>
                {idx + 1}. {question.text}
              </p>
              <div style={{ display: "grid", gap: "8px" }}>
                {["A", "B", "C", "D"].map((option) => (
                  <label
                    key={option}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px",
                      backgroundColor:
                        answers[question.id] === option ? "#dbeafe" : "white",
                      border:
                        answers[question.id] === option
                          ? "1px solid #3b82f6"
                          : "1px solid #e5e7eb",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={(e) =>
                        handleAnswerChange(question.id, e.target.value)
                      }
                      style={{ marginRight: "10px" }}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "flex-end",
          paddingTop: "20px",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            padding: "10px 20px",
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
        <button
          onClick={handleSubmit}
          disabled={submitting || answeredCount < totalQuestions}
          style={{
            padding: "10px 24px",
            backgroundColor:
              submitting || answeredCount < totalQuestions
                ? "#9ca3af"
                : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor:
              submitting || answeredCount < totalQuestions
                ? "not-allowed"
                : "pointer",
            fontWeight: "600",
          }}
        >
          {submitting ? "Submitting..." : "Submit Exam"}
        </button>
      </div>
    </div>
  );
}
