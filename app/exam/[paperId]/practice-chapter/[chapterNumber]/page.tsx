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
  const chapterNumber = params.chapterNumber ? parseInt(params.chapterNumber as string) : null;

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
  // Answers given in this chapter run, saved to the student's progress at the end
  const [runAnswers, setRunAnswers] = useState<{ questionId: string; answer: string }[]>([]);
  const [paperTitle, setPaperTitle] = useState<string>("");
  const [paperDescription, setPaperDescription] = useState<string>("");

  // Debug: Log feedback state changes
  useEffect(() => {
    console.log("🔍 Practice Chapter Debug:", { showingFeedback, feedbackExists: !!feedback });
  }, [showingFeedback, feedback]);

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

  // Auto-load chapter if provided in URL
  useEffect(() => {
    if (chapterNumber && chapters.length > 0) {
      handleSelectChapter(chapterNumber);
    }
  }, [chapterNumber, chapters]);

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
    setRunAnswers([]);
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
        console.log("Feedback received:", data);
        setFeedback(data);
        setShowingFeedback(true);
        if (data.isCorrect) {
          setScore(score + 1);
        }
        setAnswered(answered + 1);
        setRunAnswers((prev) => [...prev, { questionId: String(questions[currentQIndex].id), answer: selectedAnswer }]);
      } else {
        console.error("API response not ok:", res.status);
      }
    } catch (error) {
      console.error("Submit answer error:", error);
      alert("Error submitting answer");
    }
  };

  // Saves the finished chapter run so it appears in Progress. Failures are ignored
  // so the student is never blocked from continuing.
  const saveChapterRun = () => {
    if (runAnswers.length === 0 || selectedChapter === null) return;
    fetch("/api/student/quick-quiz-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paperId,
        mode: "chapter",
        chapterNumber: selectedChapter,
        answers: runAnswers,
      }),
    }).catch((err) => console.error("Save chapter practice error:", err));
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
      setSelectedAnswer("");
      setFeedback(null);
      setShowingFeedback(false);
    } else {
      saveChapterRun();
      setSelectedChapter(null);
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading chapters...</div>;

  // Chapter selection view
  if (selectedChapter === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <StudentNav />

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12 px-0 border-b border-blue-900">
          <div className="max-w-7xl mx-auto px-6">
            <button
              onClick={() => router.back()}
              className="text-white hover:text-blue-100 font-medium text-sm mb-6 transition duration-200"
            >
              ← Back
            </button>
            <h1 className="text-4xl font-bold mb-2">{paperTitle || "Practice by Chapter"}</h1>
            {paperDescription && (
              <p className="text-blue-100 mb-2 truncate" title={paperDescription}>
                {paperDescription}
              </p>
            )}
            <p className="text-gray-200">Select a chapter to practice questions from that specific topic</p>
          </div>
        </div>

        {/* Chapters List */}
        <div className="bg-white flex-1 w-full">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="space-y-3">
              {chapters.map((ch) => (
                <button
                  key={ch.number}
                  onClick={() => handleSelectChapter(ch.number)}
                  className="w-full bg-gray-50 rounded-lg px-6 py-6 border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition duration-200 text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-900 text-white rounded-lg flex items-center justify-center group-hover:bg-blue-800 transition duration-200 font-semibold text-lg">
                      {ch.number}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition text-lg">
                        {ch.title}
                      </h3>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition flex-shrink-0 ml-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
            </div>
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

      {/* Back to Practice Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-4 w-full">
        <button
          onClick={() => router.push(`/exam/${paperId}`)}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm transition duration-200"
        >
          ← Back to Practice
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-4xl">
          {/* Header */}
          <div className="mb-5 flex justify-between items-center">
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
          <div className="w-full h-2 bg-gray-200 rounded-full mb-5 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(progress / questions.length) * 100}%` }}
            />
          </div>

          {/* Question */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
            <p className="m-0 font-medium text-base leading-relaxed text-gray-900">
              {currentQuestion.text}
            </p>
          </div>

          {/* Answer options */}
          <div className="space-y-2 mb-5">
            {buildOptions(currentQuestion, orderFor(currentQuestion.id)).map((option) => (
              <label
                key={option.key}
                className={`flex items-center p-3 text-sm rounded-lg border-2 cursor-pointer transition duration-200 ${
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
