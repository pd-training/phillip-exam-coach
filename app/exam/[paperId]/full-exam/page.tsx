"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import StudentNav from "@/components/StudentNav";

interface Question {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

interface ExamConfig {
  title: string;
  totalTime: number;
  passingScore: number;
  hasParts?: boolean;
}

interface ExamPart {
  partName: string;
  partId?: string;
  passingScore: number;
  questions?: Question[];
  questionCount?: number;
}

export default function FullExamMode() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const paperId = params.paperId as string;

  const [examConfig, setExamConfig] = useState<ExamConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [parts, setParts] = useState<ExamPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);

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
        if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions);
          setTimeLeft(data.examConfig.totalTime * 60);
          
          // Set exam parts if they exist
          if (data.questionsByPart && Array.isArray(data.questionsByPart) && data.questionsByPart.length > 0) {
            // Store parts with proper question counts from questionsByPart
            const partsWithQuestions = data.questionsByPart.map((part: any) => ({
              partName: part.part,
              partId: part.partId,
              passingScore: part.passingScore,
              questions: part.questions,
              questionCount: part.questions?.length || 0,
            }));
            setParts(partsWithQuestions);
            console.log('Exam parts loaded:', partsWithQuestions);
          }
        } else {
          alert('No questions found for this exam');
        }
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
      // Auto-submit when time is up (bypass warning)
      submitAttempt();
      return;
    }

    if (submitted || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, submitted, examConfig]);

  const handleAnswerChange = (answer: string) => {
    const questionId = questions[currentQIndex].id;
    setAnswers({ ...answers, [questionId]: answer });
  };

  const toggleFlag = () => {
    const questionId = questions[currentQIndex].id;
    const newFlagged = new Set(flagged);
    if (newFlagged.has(questionId)) {
      newFlagged.delete(questionId);
    } else {
      newFlagged.add(questionId);
    }
    setFlagged(newFlagged);
  };

  const handlePrevious = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(currentQIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQIndex(index);
  };

  // Actual submission to API
  const submitAttempt = async () => {
    setSubmitting(true);
    try {
      // Calculate time taken (in seconds)
      const timeTaken = (examConfig?.totalTime || 0) * 60 - timeLeft;
      
      const res = await fetch(`/api/papers/${paperId}/practice/full-exam`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (session?.user as any)?.id,
          answers,
          timeTaken,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to review page with sidebar navigation
        router.push(`/exam/attempts/${data.attemptId}`);
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

  // Check if all questions are answered, show warning if not
  const handleSubmit = () => {
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = questions.length;

    if (answeredCount < totalQuestions) {
      // Show warning - not all questions answered
      setShowIncompleteWarning(true);
    } else {
      // All questions answered - proceed with submission
      submitAttempt();
    }
  };

  // Confirm submission even if incomplete
  const handleConfirmSubmit = () => {
    setShowIncompleteWarning(false);
    submitAttempt();
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
          {questions.map((question: Question, idx: number) => {
            // Find if this question was answered
            const answerData = result.answers.find((a: any) => a.questionId === question.id);
            
            return (
              <div
                key={question.id}
                style={{
                  padding: "15px",
                  marginBottom: "10px",
                  backgroundColor: answerData 
                    ? (answerData.isCorrect ? "#f0fdf4" : "#fef2f2")
                    : "#f3f4f6",
                  borderLeft: `4px solid ${
                    answerData 
                      ? (answerData.isCorrect ? "#22c55e" : "#ef4444")
                      : "#9ca3af"
                  }`,
                  borderRadius: "4px",
                  opacity: answerData ? 1 : 0.7,
                }}
              >
                <p style={{ margin: "0 0 8px 0", fontWeight: "600" }}>
                  Q{idx + 1}: {
                    answerData 
                      ? (answerData.isCorrect ? "✓ Correct" : "✗ Incorrect")
                      : "⭕ Not Answered"
                  }
                </p>
                {question.text && (
                  <p style={{ margin: "0 0 12px 0", fontSize: "14px", lineHeight: "1.5", color: "#1f2937" }}>
                    {question.text}
                  </p>
                )}
                
                {answerData ? (
                  <>
                    <div style={{ margin: "0 0 12px 0", fontSize: "14px" }}>
                      <p style={{ margin: "0 0 6px 0" }}>
                        Your answer: <strong>{answerData.studentAnswer}.</strong> {
                          answerData.studentAnswer === "A" ? answerData.optionA :
                          answerData.studentAnswer === "B" ? answerData.optionB :
                          answerData.studentAnswer === "C" ? answerData.optionC :
                          answerData.optionD
                        }
                      </p>
                      <p style={{ margin: "0", fontSize: "14px", color: "#059669" }}>
                        Correct answer: <strong>{answerData.correctAnswer}.</strong> {
                          answerData.correctAnswer === "A" ? answerData.optionA :
                          answerData.correctAnswer === "B" ? answerData.optionB :
                          answerData.correctAnswer === "C" ? answerData.optionC :
                          answerData.optionD
                        }
                      </p>
                    </div>
                    {answerData.explanation && (
                      <div style={{
                        marginTop: "12px",
                        padding: "12px",
                        backgroundColor: answerData.isCorrect ? "#ecfdf5" : "#fef3c7",
                        border: `1px solid ${answerData.isCorrect ? "#d1fae5" : "#fde68a"}`,
                        borderRadius: "4px",
                        fontSize: "13px",
                        lineHeight: "1.5",
                        color: "#374151",
                      }}>
                        <p style={{ margin: "0 0 6px 0", fontWeight: "600", color: "#1f2937" }}>
                          📝 Explanation
                        </p>
                        <p style={{ margin: "0" }}>
                          {answerData.explanation}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ margin: "0", fontSize: "13px", color: "#6b7280", fontStyle: "italic" }}>
                    No answer submitted for this question.
                  </p>
                )}
              </div>
            );
          })}
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

  if (questions.length === 0) {
    return <div style={{ padding: "20px" }}>Loading questions...</div>;
  }

  const currentQuestion = questions[currentQIndex];
  const answeredCount = Object.keys(answers).length;
  const isFlagged = flagged.has(currentQuestion.id);
  const isAnswered = currentQuestion.id in answers;

  // Determine which part the current question belongs to
  const getCurrentPart = () => {
    if (parts.length === 0) return null;
    
    // Find cumulative question index across parts
    let questionIndex = 0;
    for (const part of parts) {
      const partQuestionCount = part.questions?.length || 0;
      if (currentQIndex < questionIndex + partQuestionCount) {
        return {
          ...part,
          questionInPart: currentQIndex - questionIndex + 1,
          totalInPart: partQuestionCount,
        };
      }
      questionIndex += partQuestionCount;
    }
    return null;
  };

  const currentPart = getCurrentPart();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <StudentNav />

      {/* Exam Header */}
      <div className="bg-white border-b border-gray-200 px-0 py-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{examConfig?.title || "Full Exam Mode"}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {currentPart 
                ? `${currentPart.partName} (Q${currentPart.questionInPart}/${currentPart.totalInPart}) – Chapters ${currentPart.chapterStart}–${currentPart.chapterEnd}`
                : "Full Exam Mode"
              }
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-sm text-gray-600">
              Question <span className="font-semibold text-gray-900">{currentQIndex + 1}</span> of <span className="font-semibold text-gray-900">{questions.length}</span>
            </div>
            <div className={`text-xl font-bold ${timeLeft < 300 ? "text-red-600" : "text-blue-600"}`}>
              ⏱ {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content & Sidebar */}
      <div className="flex-1 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6 h-full flex overflow-hidden">
          {/* Left Main Content */}
          <div className="flex-1 flex flex-col py-8 pr-6 overflow-y-auto">




            {/* Question */}
            <div
              style={{
                padding: "25px",
                backgroundColor: "white",
                borderRadius: "8px",
                marginBottom: "25px",
                border: "1px solid #e5e7eb",
                flex: 1,
              }}
            >
            <p
              style={{
                margin: "0 0 20px 0",
                fontSize: "18px",
                lineHeight: "1.6",
                fontWeight: "500",
                color: "#1f2937",
              }}
            >
              {currentQuestion.text}
            </p>

            {/* Answer Options */}
            <div style={{ marginTop: "25px" }}>
              {[
                { key: "A", text: currentQuestion.optionA },
                { key: "B", text: currentQuestion.optionB },
                { key: "C", text: currentQuestion.optionC },
                { key: "D", text: currentQuestion.optionD },
              ].map((option) => (
                <label
                  key={option.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "15px",
                    marginBottom: "12px",
                    backgroundColor:
                      answers[currentQuestion.id] === option.key ? "#dbeafe" : "white",
                    border:
                      answers[currentQuestion.id] === option.key
                        ? "2px solid #3b82f6"
                        : "1px solid #e5e7eb",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option.key}
                    checked={answers[currentQuestion.id] === option.key}
                    onChange={() => handleAnswerChange(option.key)}
                    style={{ marginRight: "12px", cursor: "pointer" }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: "500", fontSize: "16px", marginRight: "8px" }}>{option.key}.</span>
                    <span style={{ fontSize: "15px" }}>{option.text}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "20px",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handlePrevious}
                disabled={currentQIndex === 0}
                style={{
                  padding: "10px 20px",
                  backgroundColor: currentQIndex === 0 ? "#f3f4f6" : "#white",
                  color: currentQIndex === 0 ? "#9ca3af" : "#1f2937",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: currentQIndex === 0 ? "not-allowed" : "pointer",
                  fontWeight: "500",
                }}
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                disabled={currentQIndex === questions.length - 1}
                style={{
                  padding: "10px 20px",
                  backgroundColor:
                    currentQIndex === questions.length - 1 ? "#f3f4f6" : "white",
                  color:
                    currentQIndex === questions.length - 1 ? "#9ca3af" : "#1f2937",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: currentQIndex === questions.length - 1 ? "not-allowed" : "pointer",
                  fontWeight: "500",
                }}
              >
                Next →
              </button>
            </div>

            <button
              onClick={toggleFlag}
              style={{
                padding: "10px 16px",
                backgroundColor: "white",
                color: isFlagged ? "#f97316" : "#9ca3af",
                border: `2px solid ${isFlagged ? "#f97316" : "#e5e7eb"}`,
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500",
                transition: "all 0.2s",
              }}
            >
              {isFlagged ? "🚩 Flagged" : "🚩 Flag for review"}
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div
          style={{
            width: "280px",
            backgroundColor: "#f9fafb",
            borderLeft: "1px solid #e5e7eb",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          {/* Part Info - If parts exist */}
          {parts.length > 0 && currentPart && (
            <div style={{ marginBottom: "20px", padding: "12px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px" }}>
              <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#0c4a6e", fontWeight: "600" }}>
                CURRENT PART
              </p>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e40af", marginBottom: "6px" }}>
                {currentPart.partName}
              </div>
              <div style={{ fontSize: "12px", color: "#0c4a6e", lineHeight: "1.6" }}>
                {currentPart.chapterStart && currentPart.chapterEnd && (
                  <div style={{ marginBottom: "4px", padding: "6px", backgroundColor: "#dbeafe", borderRadius: "4px", fontWeight: "500" }}>
                    Chapters {currentPart.chapterStart}–{currentPart.chapterEnd}
                  </div>
                )}
                <div>Progress: Q{currentPart.questionInPart}/{currentPart.totalInPart}</div>
                <div>Passing: {currentPart.passingScore}%</div>
              </div>
            </div>
          )}

          {/* Progress Counter */}
          <div style={{ marginBottom: "20px", paddingBottom: "15px", borderBottom: "1px solid #e5e7eb" }}>
            <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#666", fontWeight: "500" }}>
              PROGRESS
            </p>
            <p style={{ margin: "0", fontSize: "18px", fontWeight: "600", color: "#1f2937" }}>
              {answeredCount} answered | {questions.length - answeredCount} left
            </p>
          </div>

          {/* Question Navigator Grid */}
          <div style={{ marginBottom: "20px" }}>
            <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#666", fontWeight: "500" }}>
              QUESTION NAVIGATOR
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "8px",
                maxHeight: "400px",
                overflowY: "auto",
                paddingRight: "5px",
              }}
            >
              {questions.map((q, idx, arr) => {
                const qAnswered = q.id in answers;
                const qFlagged = flagged.has(q.id);
                const isCurrent = idx === currentQIndex;
                
                // Find which part this question belongs to
                let questionPartIndex = 0;
                let isPartStart = false;
                if (parts.length > 0) {
                  let cumIndex = 0;
                  for (let i = 0; i < parts.length; i++) {
                    const partQuestionCount = parts[i].questionCount || 0;
                    if (idx < cumIndex + partQuestionCount) {
                      questionPartIndex = i;
                      isPartStart = idx === cumIndex;
                      break;
                    }
                    cumIndex += partQuestionCount;
                  }
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => handleJumpToQuestion(idx)}
                    style={{
                      padding: "10px",
                      backgroundColor: isCurrent
                        ? "#3b82f6"
                        : qAnswered
                        ? "#e0e7ff"
                        : "white",
                      color: isCurrent ? "white" : "#1f2937",
                      border: isCurrent
                        ? "2px solid #3b82f6"
                        : isPartStart && parts.length > 0
                        ? "2px solid #1e40af"
                        : qAnswered
                        ? "1px solid #c7d2fe"
                        : "1px solid #d1d5db",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: isPartStart ? "700" : "500",
                      fontSize: "12px",
                      transition: "all 0.2s",
                      position: "relative",
                      boxShadow: isPartStart && parts.length > 0 ? "0 0 4px #1e40af" : "none",
                    }}
                    title={isPartStart && parts.length > 0 ? `Start of ${parts[questionPartIndex]?.partName}` : ""}
                  >
                    {idx + 1}
                    {qFlagged && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-6px",
                          right: "-6px",
                          fontSize: "12px",
                        }}
                      >
                        🚩
                      </span>
                      )}
                    </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: "12px",
                backgroundColor: submitting ? "#9ca3af" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: submitting ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              {submitting ? "Submitting..." : "✓ Submit Exam"}
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Incomplete Answers Warning Modal */}
      {showIncompleteWarning && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "32px",
            maxWidth: "450px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
            }}>
              <div style={{
                fontSize: "32px",
                marginRight: "12px",
              }}>
                ⚠️
              </div>
              <h2 style={{
                margin: "0",
                fontSize: "20px",
                fontWeight: "600",
                color: "#1f2937",
              }}>
                Not All Questions Answered
              </h2>
            </div>
            <p style={{
              margin: "0 0 24px 0",
              color: "#6b7280",
              fontSize: "14px",
              lineHeight: "1.6",
            }}>
              You have {Object.keys(answers).length} out of {questions.length} questions answered. 
              Would you like to submit anyway or go back to complete the remaining questions?
            </p>
            <div style={{
              display: "flex",
              gap: "12px",
            }}>
              <button
                onClick={() => setShowIncompleteWarning(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d1d5db")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#e5e7eb")}
              >
                ← Go Back
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: submitting ? "#9ca3af" : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => !submitting && (e.currentTarget.style.backgroundColor = "#2563eb")}
                onMouseLeave={(e) => !submitting && (e.currentTarget.style.backgroundColor = "#3b82f6")}
              >
                {submitting ? "Submitting..." : "✓ Submit Anyway"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
