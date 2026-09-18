import * as XLSX from "xlsx";

export interface PaperData {
  title: string;
  moduleCode: string;
  durationMinutes: number;
  totalQuestions: number;
}

export interface QuestionData {
  questionNumber: number;
  section: string;
  chapter: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  difficulty: string;
  explanation: string;
}

export function parseExcelFile(buffer: ArrayBuffer): {
  paperData: PaperData;
  questions: QuestionData[];
  errors: string[];
} {
  const workbook = XLSX.read(buffer, { type: "array" });
  const errors: string[] = [];

  // Parse Paper Info
  const paperSheet = workbook.Sheets["Paper Info"];
  if (!paperSheet) {
    errors.push("Missing 'Paper Info' sheet");
    return { paperData: {} as PaperData, questions: [], errors };
  }

  const paperData: any = {};
  const paperRows = XLSX.utils.sheet_to_json(paperSheet, { header: 1 });

  (paperRows as any[]).forEach((row: any[]) => {
    const key = row[0]?.toLowerCase().replace(/\s+/g, "");
    const value = row[1];
    if (key === "papertitle") paperData.title = value;
    if (key === "modulecode") paperData.moduleCode = value;
    if (key === "durationminutes") paperData.durationMinutes = Number(value);
    if (key === "totalquestions") paperData.totalQuestions = Number(value);
  });

  // Validate paper data
  if (!paperData.title) errors.push("Missing paper title");
  if (!paperData.moduleCode) errors.push("Missing module code");
  if (!paperData.durationMinutes) errors.push("Missing duration");
  if (!paperData.totalQuestions) errors.push("Missing total questions");

  // Parse Questions
  const questionsSheet = workbook.Sheets["Questions"];
  if (!questionsSheet) {
    errors.push("Missing 'Questions' sheet");
    return { paperData, questions: [], errors };
  }

  const questionsData = XLSX.utils.sheet_to_json(questionsSheet);
  const questions: QuestionData[] = (questionsData as any[]).map((row: any) => ({
    questionNumber: row["Q#"] || row["Q"],
    section: row["Section"] || "",
    chapter: row["Chapter"] || "",
    questionText: row["Question Text"] || "",
    optionA: row["Option A"] || "",
    optionB: row["Option B"] || "",
    optionC: row["Option C"] || "",
    optionD: row["Option D"] || "",
    correctAnswer: row["Correct"] || "",
    difficulty: row["Difficulty"] || "MEDIUM",
    explanation: row["Explanation"] || "",
  }));

  // Validate questions
  questions.forEach((q, idx) => {
    if (!q.questionText) errors.push(`Question ${idx + 1}: Missing text`);
    if (!q.correctAnswer) errors.push(`Question ${idx + 1}: Missing correct answer`);
    if (!["A", "B", "C", "D"].includes(q.correctAnswer.toUpperCase())) {
      errors.push(`Question ${idx + 1}: Invalid correct answer (must be A/B/C/D)`);
    }
  });

  return { paperData, questions, errors };
}
