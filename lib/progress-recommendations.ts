// Rules-based study recommendations built from a student's answered questions.
// Chapter numbers only mean something inside one paper, so every grouping key
// includes the paper id.

export const MIN_ANSWERS_TO_RANK = 5; // below this, a chapter is too thin to rank
export const PRIORITY_BELOW = 60; // accuracy under this = "practise now"
export const REVIEW_BELOW = 80; // accuracy under this = "review soon"
export const MAX_PER_GROUP = 3;

export interface AnsweredQuestion {
  attemptId: string;
  paperId: string;
  paperTitle: string;
  chapterNumber: number;
  chapterTitle: string | null;
  correct: boolean;
}

export interface ChapterStat {
  paperId: string;
  paperTitle: string;
  chapterNumber: number;
  chapterTitle: string | null;
  correct: number;
  total: number;
  accuracy: number;
  attemptCount: number;
}

export interface UntouchedPaper {
  paperId: string;
  paperTitle: string;
  chapters: { chapterNumber: number; chapterTitle: string | null }[];
}

export interface Recommendations {
  priority: ChapterStat[];
  review: ChapterStat[];
  notPractised: UntouchedPaper[];
  notRankedCount: number;
  totalAnswered: number;
}

export function aggregateByChapter(answered: AnsweredQuestion[]): ChapterStat[] {
  const map = new Map<
    string,
    { stat: Omit<ChapterStat, 'accuracy'>; attempts: Set<string> }
  >();

  for (const q of answered) {
    const key = `${q.paperId}|${q.chapterNumber}`;
    let entry = map.get(key);
    if (!entry) {
      entry = {
        stat: {
          paperId: q.paperId,
          paperTitle: q.paperTitle,
          chapterNumber: q.chapterNumber,
          chapterTitle: q.chapterTitle,
          correct: 0,
          total: 0,
          attemptCount: 0,
        },
        attempts: new Set(),
      };
      map.set(key, entry);
    }
    entry.stat.total += 1;
    if (q.correct) entry.stat.correct += 1;
    entry.attempts.add(q.attemptId);
  }

  return Array.from(map.values()).map(({ stat, attempts }) => ({
    ...stat,
    attemptCount: attempts.size,
    accuracy: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
  }));
}

export function buildRecommendations(
  answered: AnsweredQuestion[],
  // paperId -> chapters that exist in the paper's question bank
  paperChapters: Map<string, { paperTitle: string; chapters: { chapterNumber: number; chapterTitle: string | null }[] }>
): Recommendations {
  const stats = aggregateByChapter(answered);
  const ranked = stats.filter((s) => s.total >= MIN_ANSWERS_TO_RANK);

  const priority = ranked
    .filter((s) => s.accuracy < PRIORITY_BELOW)
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
    .slice(0, MAX_PER_GROUP);

  const review = ranked
    .filter((s) => s.accuracy >= PRIORITY_BELOW && s.accuracy < REVIEW_BELOW)
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
    .slice(0, MAX_PER_GROUP);

  // Chapters that exist in a paper but have no answers at all yet
  const answeredKeys = new Set(stats.map((s) => `${s.paperId}|${s.chapterNumber}`));
  const notPractised: UntouchedPaper[] = [];
  for (const [paperId, info] of paperChapters) {
    const chapters = info.chapters.filter(
      (c) => !answeredKeys.has(`${paperId}|${c.chapterNumber}`)
    );
    if (chapters.length > 0) {
      notPractised.push({ paperId, paperTitle: info.paperTitle, chapters });
    }
  }

  return {
    priority,
    review,
    notPractised,
    notRankedCount: stats.length - ranked.length,
    totalAnswered: answered.length,
  };
}
