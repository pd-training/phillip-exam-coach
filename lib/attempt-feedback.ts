// AI-written feedback for a student's exam attempt.
// Facts are gathered on the server from the attempt record, so the model only
// sees data the student is allowed to see. If anything fails, callers fall
// back to the rules-based text on the page.

import prisma from '@/lib/prisma';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';
const MAX_WRONG_QUESTIONS = 12;

export interface FeedbackResult {
  lines: string[] | null;
  source: 'ai' | 'rules';
}

type ChapterCount = { chapter: number; correct: number; total: number };

function parseJsonField(value: unknown): any {
  if (value == null) return null;
  return typeof value === 'string' ? JSON.parse(value) : value;
}

function chapterCounts(
  questionIds: string[],
  answers: Record<string, string>,
  questions: any[]
): { chapters: ChapterCount[]; wrong: any[] } {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const counts: Record<number, ChapterCount> = {};
  const wrong: any[] = [];

  for (const id of questionIds) {
    const q = byId.get(id);
    if (!q) continue;
    const studentKey = answers[id] ?? null;
    const isCorrect = studentKey === q.correctAnswer;
    const entry = counts[q.chapterNumber] ?? (counts[q.chapterNumber] = { chapter: q.chapterNumber, correct: 0, total: 0 });
    entry.total += 1;
    if (isCorrect) entry.correct += 1;
    if (!isCorrect) wrong.push({ q, studentKey });
  }

  return {
    chapters: Object.values(counts).sort((a, b) => a.chapter - b.chapter),
    wrong,
  };
}

const optionText = (q: any, key: string | null) => {
  if (!key) return 'not answered';
  const map: Record<string, string> = { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD };
  return map[key] ?? 'not answered';
};

async function gatherFacts(attemptId: string, userId: string) {
  const rows = (await prisma.$queryRaw`
    SELECT ea.id, ea.paperid::text AS paperid, ea.score, ea.passed, ea.submittedat,
           ea.answers, ea."questionIds", p.title AS paper_title, p."passingScore"
    FROM examattempt ea
    JOIN "Paper" p ON ea.paperid = p.id
    WHERE ea.id = ${attemptId} AND ea.userid = ${userId}
  `) as any[];
  if (!rows || rows.length === 0) return null;
  const attempt = rows[0];

  const answers: Record<string, string> = parseJsonField(attempt.answers) || {};
  const questionIds: string[] = parseJsonField(attempt.questionIds) || Object.keys(answers);

  const questions = (await prisma.$queryRaw`
    SELECT id, "questionText", "chapterNumber", "correctAnswer", explanation,
           "optionA", "optionB", "optionC", "optionD"
    FROM "Question"
    WHERE "paperId"::text = ${attempt.paperid}::text
  `) as any[];

  const current = chapterCounts(questionIds, answers, questions);

  // Previous attempt on the same paper, for comparison
  let previous: { score: number; chapters: ChapterCount[] } | null = null;
  const prevRows = (await prisma.$queryRaw`
    SELECT id, score, answers, "questionIds"
    FROM examattempt
    WHERE userid = ${userId}
      AND paperid = ${attempt.paperid}::uuid
      AND id <> ${attempt.id}
      AND score IS NOT NULL
      AND submittedat < ${attempt.submittedat}
    ORDER BY submittedat DESC
    LIMIT 1
  `) as any[];
  if (prevRows && prevRows.length > 0) {
    const prev = prevRows[0];
    const prevAnswers: Record<string, string> = parseJsonField(prev.answers) || {};
    const prevIds: string[] = parseJsonField(prev['questionIds']) || Object.keys(prevAnswers);
    previous = {
      score: prev.score,
      chapters: chapterCounts(prevIds, prevAnswers, questions).chapters,
    };
  }

  const wrongQuestions = current.wrong.slice(0, MAX_WRONG_QUESTIONS).map(({ q, studentKey }) => ({
    chapter: q.chapterNumber,
    question: String(q.questionText || '').slice(0, 300),
    correctAnswer: optionText(q, q.correctAnswer),
    studentAnswer: optionText(q, studentKey),
    explanation: String(q.explanation || '').slice(0, 300),
  }));

  return {
    facts: {
      paper: attempt.paper_title,
      score: attempt.score,
      passingScore: attempt.passingScore ?? 50,
      passed: !!attempt.passed,
      chapters: current.chapters,
      wrongQuestions,
      previous,
    },
    attemptRow: attempt,
  };
}

const SYSTEM_PROMPT = `You write short, personalised feedback for a student who has just reviewed an exam attempt on a financial adviser exam prep platform.

Rules:
- Use only the facts provided. Do not invent topics, numbers or history.
- Write exactly two lines.
- Line 1: say how the student is doing overall, then name the chapter or concept to revise next. Use the wrong questions to make it specific (for example, the topic those questions cover), in one short sentence.
- Line 2: compare with the previous attempt if one is provided (say whether the score is higher, steady or lower, and mention any chapter that clearly improved or needs more practice). If there is no previous attempt, say it is the first attempt on this paper. End with an encouraging phrase.
- If the student passed or is within 10 points of the pass mark, be upbeat and say they are on track or close to passing. Otherwise be reassuring and practical.
- Each line must be under 35 words.
- Do not write percentages or numeric scores. Do not mention that you are an AI.
- Return only JSON in this exact form: {"lines": ["line 1", "line 2"]}`;

async function callModel(facts: unknown): Promise<string[] | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      temperature: 0.4,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify(facts) }],
    }),
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error('Feedback model error:', res.status);
    return null;
  }

  const data = await res.json();
  const text: string = (data.content || [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('');
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  const parsed = JSON.parse(match[0]);
  const lines = Array.isArray(parsed.lines) ? parsed.lines : null;
  if (!lines || lines.length !== 2) return null;
  if (!lines.every((l: unknown) => typeof l === 'string' && l.trim().length > 0 && l.length <= 300)) return null;
  return lines.map((l: string) => l.trim());
}

export async function getAttemptFeedback(attemptId: string, userId: string): Promise<FeedbackResult | null> {
  const gathered = await gatherFacts(attemptId, userId);
  if (!gathered) return null;

  // Cached result (best effort: the column may not exist yet)
  try {
    const cached = (await prisma.$queryRaw`
      SELECT "aiFeedback" FROM examattempt WHERE id = ${attemptId}
    `) as any[];
    const value = parseJsonField(cached?.[0]?.aiFeedback);
    if (value && Array.isArray(value.lines) && value.lines.length === 2) {
      return { lines: value.lines, source: 'ai' };
    }
  } catch {
    // column not added yet; generate without caching
  }

  let lines: string[] | null = null;
  try {
    lines = await callModel(gathered.facts);
  } catch (err) {
    console.error('Feedback generation failed:', err);
  }
  if (!lines) return { lines: null, source: 'rules' };

  try {
    await prisma.$queryRaw`
      UPDATE examattempt SET "aiFeedback" = ${JSON.stringify({ lines })}::jsonb WHERE id = ${attemptId}
    `;
  } catch {
    // caching is optional
  }

  return { lines, source: 'ai' };
}
