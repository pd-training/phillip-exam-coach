// AI study advice and exam feedback. Only chapter-level numbers and scores are
// sent to the model: no names, emails or ids.

import type { Recommendations } from "@/lib/progress-recommendations";
import { invokeBedrockText } from "@/lib/bedrock";

export interface StudyAdvice {
  title: string;
  action: string;
}

export interface ExamResult {
  paperId: string;
  paperName: string;
  passingScore: number;
  latestScore: number | null;
  attempts: number;
}

export interface PaperReadiness {
  paperName: string;
  level: "Ready" | "Getting there" | "Not yet ready" | "Not tried yet";
  detail: string;
}

export interface StudyAdviceResult {
  readiness: PaperReadiness[];
  advice: StudyAdvice[];
}

const ADVICE_SYSTEM_PROMPT = `You are a study coach for students preparing for Singapore CMFAS exams.
You receive a student's practice results by chapter, and their exam simulation results with pass marks.
Give 3 to 4 short, concrete actions that will best prepare the student for the real exam, in plain English.
Only mention chapters and papers that appear in the data. Do not invent numbers.
Every title and action must name the paper (use the paper name as given) and the chapter number, for example "HI, Chapter 11". Never write a heading that leaves out the paper.
Reply with JSON only, no other text, in this shape:
{"advice":[{"title":"short heading that names the paper and chapter","action":"one or two sentences that name the paper and chapter"}]}`;

function levelFor(exam: ExamResult, hasWeakChapters: boolean): PaperReadiness {
  if (exam.latestScore === null) {
    return { paperName: exam.paperName, level: "Not tried yet", detail: "No exam simulation taken yet." };
  }
  const score = exam.latestScore;
  const pass = exam.passingScore;
  const detail = `Latest exam simulation: ${score}% (pass mark ${pass}%).`;
  if (score >= pass + 10 && !hasWeakChapters) {
    return { paperName: exam.paperName, level: "Ready", detail };
  }
  if (score >= pass) {
    return { paperName: exam.paperName, level: "Getting there", detail };
  }
  return { paperName: exam.paperName, level: "Not yet ready", detail };
}

export function buildReadiness(recs: Recommendations, exams: ExamResult[]): PaperReadiness[] {
  return exams.map((exam) => {
    const weak = [...recs.priority, ...recs.review].some((s) => s.paperId === exam.paperId);
    return levelFor(exam, weak);
  });
}

function summarise(recs: Recommendations, readiness: PaperReadiness[]): string {
  const lines: string[] = [];
  lines.push(`Total practice questions answered: ${recs.totalAnswered}`);
  const fmt = (s: Recommendations["priority"][number]) =>
    `- ${s.paperTitle}, Chapter ${s.chapterNumber}${s.chapterTitle ? ` (${s.chapterTitle})` : ""}: ${s.accuracy}% correct from ${s.total} answers`;
  lines.push("Chapters to practise now (under 60% correct):");
  lines.push(recs.priority.length ? recs.priority.map(fmt).join("\n") : "None");
  lines.push("Chapters to review soon (60% to 79% correct):");
  lines.push(recs.review.length ? recs.review.map(fmt).join("\n") : "None");
  lines.push("Papers with chapters not yet practised:");
  lines.push(
    recs.notPractised.length
      ? recs.notPractised.map((p) => `- ${p.paperTitle}: ${p.chapters.length} chapters untouched`).join("\n")
      : "None"
  );
  lines.push("Exam readiness (already decided, for context):");
  lines.push(readiness.map((r) => `- ${r.paperName}: ${r.level}. ${r.detail}`).join("\n") || "No exam simulations yet");
  return lines.join("\n");
}

function parseJsonObject(text: string): any {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in model reply");
  return JSON.parse(text.slice(start, end + 1));
}

function cleanAdvice(items: any): StudyAdvice[] {
  return (Array.isArray(items) ? items : [])
    .filter((i: any) => typeof i?.title === "string" && typeof i?.action === "string")
    .slice(0, 4)
    .map((i: any) => ({ title: i.title.slice(0, 80), action: i.action.slice(0, 300) }));
}

export async function generateStudyAdvice(
  recs: Recommendations,
  exams: ExamResult[]
): Promise<StudyAdviceResult> {
  const readiness = buildReadiness(recs, exams);
  if (recs.totalAnswered === 0 && exams.length === 0) return { readiness, advice: [] };
  const text = await invokeBedrockText({
    system: ADVICE_SYSTEM_PROMPT,
    user: summarise(recs, readiness),
  });
  return { readiness, advice: cleanAdvice(parseJsonObject(text).advice) };
}

export interface FocusInput {
  chapterNumber: number;
  title: string | null;
  percentage: number;
  correct: number;
  total: number;
}

export interface FocusPick {
  chapterNumber: number;
  note: string;
}

const FOCUS_SYSTEM_PROMPT = `You are a study coach for students preparing for Singapore CMFAS exams.
You receive a student's full practice results for one paper, by chapter.
Pick the up to 3 chapters the student should focus on next to improve their exam result, using the numbers given.
For each, write one short sentence (under 25 words) saying why, and what to do.
Only use chapter numbers from the data. Do not invent numbers.
Reply with JSON only, no other text, in this shape:
{"focus":[{"chapterNumber":1,"note":"one short sentence"}]}`;

// AI picks the focus chapters for one paper. Only chapter numbers from the input are accepted.
export async function generateFocusPicks(
  paperName: string,
  chapters: FocusInput[]
): Promise<FocusPick[]> {
  if (chapters.length === 0) return [];
  const lines = [
    `Paper: ${paperName}`,
    "Chapter results from full practice:",
    ...chapters.map(
      (c) =>
        `- Chapter ${c.chapterNumber}${c.title ? ` (${c.title})` : ""}: ${c.percentage}% correct from ${c.total} answers`
    ),
  ];
  const text = await invokeBedrockText({
    system: FOCUS_SYSTEM_PROMPT,
    user: lines.join("\n"),
    maxTokens: 500,
  });
  const allowed = new Set(chapters.map((c) => c.chapterNumber));
  const items = Array.isArray(parseJsonObject(text).focus) ? parseJsonObject(text).focus : [];
  const picks: FocusPick[] = [];
  for (const item of items) {
    const n = Number(item?.chapterNumber);
    if (!allowed.has(n) || picks.some((p) => p.chapterNumber === n)) continue;
    if (typeof item?.note !== "string") continue;
    picks.push({ chapterNumber: n, note: item.note.slice(0, 200) });
    if (picks.length === 3) break;
  }
  if (picks.length === 0) throw new Error("No valid focus chapters in model reply");
  return picks;
}
