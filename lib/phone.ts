// Singapore mobile number rule, the same one used at sign-up.
// Returns the cleaned number, or null when the field is left empty.
export function normalizeSgPhone(raw: unknown): { value: string | null; error?: string } {
  if (raw === null || raw === undefined) return { value: null };
  if (typeof raw !== "string") return { value: null, error: "Invalid mobile number" };
  const cleaned = raw.replace(/[\s-]/g, "");
  if (!cleaned) return { value: null };
  if (!/^(\+65)?[89]\d{7}$/.test(cleaned)) {
    return { value: null, error: "Please enter a valid Singapore mobile number, for example 9123 4567" };
  }
  return { value: cleaned };
}
