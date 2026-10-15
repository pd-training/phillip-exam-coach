"use client";

import { useRef } from "react";
import { shuffledOrder, type OptionKey } from "@/lib/option-order";

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
