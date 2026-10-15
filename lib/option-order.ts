// Randomised display order for multiple-choice options.
//
// Each option keeps its original key (A-D) internally, so the saved answer and
// the correct-answer check always refer to the same option. Only the letter
// shown beside each option changes, so students see A-D in a shuffled order.

export const LETTERS = ["A", "B", "C", "D"] as const;
export type OptionKey = (typeof LETTERS)[number];

export function shuffledOrder(): OptionKey[] {
  const order: OptionKey[] = [...LETTERS];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** Options in display order. `key` is the original letter, `label` is what is shown. */
export function buildOptions(
  question: { optionA: string; optionB: string; optionC: string; optionD: string },
  order: OptionKey[]
) {
  const texts: Record<OptionKey, string> = {
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
  };
  return order.map((key, position) => ({
    key,
    label: LETTERS[position],
    text: texts[key],
  }));
}

/** The letter a given original option is shown under, for this question's order. */
export function displayLabel(order: OptionKey[], key: string): string {
  const position = order.indexOf(key as OptionKey);
  return position === -1 ? key : LETTERS[position];
}

/** Returns the order only if it is a valid permutation of A-D, otherwise null. */
export function sanitizeOrder(value: unknown): OptionKey[] | null {
  if (!Array.isArray(value) || value.length !== LETTERS.length) return null;
  const valid = value.every((v) => (LETTERS as readonly string[]).includes(v));
  const unique = new Set(value).size === LETTERS.length;
  return valid && unique ? (value as OptionKey[]) : null;
}

/** The letter an original option was shown under, or the key itself when no order was saved. */
export function labelFor(order: OptionKey[] | null | undefined, key: string): string {
  return order ? displayLabel(order, key) : key;
}
