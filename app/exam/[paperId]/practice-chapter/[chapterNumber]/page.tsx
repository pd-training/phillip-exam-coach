"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import StudentNav from "@/components/StudentNav";

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
  const [paperTitle, setPaperTitle] = useState<string>("");

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

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-0">
          <div className="max-w-7xl mx-auto px-6">
            <button
              onClick={() => router.back()}
              className="text-blue-100 hover:text-white font-medium text-sm mb-6 transition"
            >
              ← Back
            </button>
            <h1 className="text-4xl font-bold mb-2">Practice by Chapter</h1>
            <p className="text-blue-100">Select a chapter to practice questions from that specific topic</p>
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
                  className="w-full bg-gray-50 rounded-lg px-6 py-6 border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition duration-200 text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition font-semibold text-lg">
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
            {[
              { key: "A", text: currentQuestion.optionA },
              { key: "B", text: currentQuestion.optionB },
              { key: "C", text: currentQuestion.optionC },
              { key: "D", text: currentQuestion.optionD },
            ].map((option) => (
              <label
                key={option.key}
                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition ${
                  selectedAnswer === option.key
                    ? "bg-blue-50 border-blue-600"
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
                  <span className="font-medium text-gray-900 mr-3">{option.key}.</span>
                  <span className="text-gray-700">{option.text}</span>
                </div>
              </label>
            ))}
          </div>

          {/* Feedback */}
          {showingFeedback && feedback && (
            <div className={`rounded-lg p-6 mb-8 border-l-4 ${
              feedback.isCorrect
                ? "bg-green-50 border-green-500"
                : "bg-red-50 border-red-500"
            }`}>
              <p className={`m-0 mb-4 font-bold text-lg ${
                feedback.isCorrect ? "text-green-700" : "text-red-700"
              }`}>
                {feedback.isCorrect ? "✓ Correct!" : "✗ Incorrect"}
              </p>
              
              {/* Your answer */}
              <div className="mb-4">
                <p className="m-0 text-sm font-semibold text-gray-700 mb-2">Your answer:</p>
                <p className="m-0 text-sm text-gray-700">
                  <strong>{feedback.studentAnswer}.</strong> {
                    feedback.studentAnswer === "A" ? feedback.optionA :
                    feedback.studentAnswer === "B" ? feedback.optionB :
                    feedback.studentAnswer === "C" ? feedback.optionC :
                    feedback.optionD
                  }
                </p>
              </div>
              
              {/* Correct answer - always show */}
              <div className="mb-4">
                <p className="m-0 text-sm font-semibold text-gray-700 mb-2">Correct answer:</p>
                <p className="m-0 text-sm text-gray-700">
                  <strong>{feedback.correctAnswer}.</strong> {
                    feedback.correctAnswer === "A" ? feedback.optionA :
                    feedback.correctAnswer === "B" ? feedback.optionB :
                    feedback.correctAnswer === "C" ? feedback.optionC :
                    feedback.optionD
                  }
                </p>
              </div>
              
              {/* Explanation */}
              <div className="pt-4 border-t border-gray-300">
                <p className="m-0 text-sm text-gray-700 leading-relaxed">
                  {feedback.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedChapter(null)}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition"
            >
              Back to Chapters
            </button>
            {!showingFeedback ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
                  selectedAnswer
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Submit
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
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
      </div>
    </div>
  );
}
