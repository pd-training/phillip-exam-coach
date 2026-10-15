// Randomised display order for multiple-choice options.
//
// Each option keeps its original key (A-D) internally, so the saved answer and
// the correct-answer check always refer to the same option. Only the letter
// shown beside each option changes, so students see A-D in a shuffled order.

import { useRef } from "react";

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

/**
 * Returns a function giving each question a stable random order for the
 * lifetime of the page, so moving back and forth does not reshuffle.
 */
export function useOptionOrder() {
  const orders = useRef(new Map<string, OptionKey[]>());
  return (questionId: string): OptionKey[] => {
    let order = orders.current.get(questionId);
    if (!order) {
      order = shuffledOrder();
      orders.current.set(questionId, order);
    }
    return order;
  };
}
