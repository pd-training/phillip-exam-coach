"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/js";
import { useRouter, useParams } from "next/navigation";

interface Chapter {
  number: number;
  questionCount: number;
  title: string;
}

interface Question {
  id: string;
  text: string;
}

interface Feedback {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  studentAnswer: string;
}

export default function PracticeChapterMode() {
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
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px" }}>
        <h1>Practice by Chapter</h1>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Select a chapter to practice questions from that topic.
        </p>

        <div style={{ display: "grid", gap: "12px" }}>
          {chapters.map((ch) => (
            <button
              key={ch.number}
              onClick={() => handleSelectChapter(ch.number)}
              style={{
                padding: "16px",
                textAlign: "left",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            >
              <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                {ch.title}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                {ch.questionCount} questions
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => router.back()}
          style={{
            marginTop: "20px",
            padding: "12px 20px",
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
      </div>
    );
  }

  // Question drill view
  if (questions.length === 0) {
    return <div style={{ padding: "20px" }}>Loading questions...</div>;
  }

  const currentQuestion = questions[currentQIndex];
  const progress = currentQIndex + 1;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px" }}>
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ margin: "0" }}>
          Chapter {selectedChapter}
        </h1>
        <div style={{ fontSize: "14px", color: "#666" }}>
          Question {progress} of {questions.length}
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: "100%",
          height: "8px",
          backgroundColor: "#e5e7eb",
          borderRadius: "4px",
          marginBottom: "20px",
          overflow: "hidden",
        }}
      >
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
          onClick={() => setSelectedChapter(null)}
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
          Back to Chapters
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
            {currentQIndex < questions.length - 1 ? "Next Question" : "Back to Chapters"}
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
