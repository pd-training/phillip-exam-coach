// Turns rules-based chapter stats into a short AI study plan.
// Only chapter-level numbers are sent to the model: no names, emails or ids.

import type { Recommendations } from "@/lib/progress-recommendations";
import { invokeBedrockText } from "@/lib/bedrock";

export interface StudyAdvice {
  title: string;
  action: string;
}

const SYSTEM_PROMPT = `You are a study coach for students preparing for Singapore CMFAS exams.
You receive a summary of a student's practice results by chapter.
Give 3 to 4 short, concrete study actions, in plain English, for a non-technical adult learner.
Only mention chapters and papers that appear in the data. Do not invent numbers.
Reply with JSON only, no other text, in this shape:
{"advice":[{"title":"short heading","action":"one or two sentences"}]}`;

function summarise(recs: Recommendations): string {
  const lines: string[] = [];
  lines.push(`Total questions answered: ${recs.totalAnswered}`);

  const fmt = (s: Recommendations["priority"][number]) =>
    `- ${s.paperTitle}, Chapter ${s.chapterNumber}${s.chapterTitle ? ` (${s.chapterTitle})` : ""}: ${s.accuracy}% correct from ${s.total} answers`;

  lines.push("Chapters to practise now (under 60% correct):");
  lines.push(recs.priority.length ? recs.priority.map(fmt).join("\n") : "None");
  lines.push("Chapters to review soon (60% to 79% correct):");
  lines.push(recs.review.length ? recs.review.map(fmt).join("\n") : "None");
  lines.push("Papers with chapters not yet practised:");
  lines.push(
    recs.notPractised.length
      ? recs.notPractised
          .map((p) => `- ${p.paperTitle}: ${p.chapters.length} chapters untouched`)
          .join("\n")
      : "None"
  );
  return lines.join("\n");
}

function parseAdvice(text: string): StudyAdvice[] {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in model reply");
  const parsed = JSON.parse(text.slice(start, end + 1));
  const items = Array.isArray(parsed?.advice) ? parsed.advice : [];
  return items
    .filter((i: any) => typeof i?.title === "string" && typeof i?.action === "string")
    .slice(0, 4)
    .map((i: any) => ({ title: i.title.slice(0, 80), action: i.action.slice(0, 300) }));
}

export async function generateStudyAdvice(recs: Recommendations): Promise<StudyAdvice[]> {
  if (recs.totalAnswered === 0) return [];
  const text = await invokeBedrockText({
    system: SYSTEM_PROMPT,
    user: summarise(recs),
  });
  return parseAdvice(text);
}
