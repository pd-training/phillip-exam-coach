export const EXAM_MODULES = [
  { code: "RES-1A", name: "Rules, Ethics and Skills" },
  { code: "RES-5", name: "Rules, Ethics and Skills for Financial Advisory Services" },
  { code: "CM-SIP", name: "Capital Markets - Specified Investment Products" },
  { code: "CM-LIP", name: "Life Insurance and Investment-Linked Policies" },
  { code: "HI", name: "Health Insurance" },
];

export const DIFFICULTY_LEVELS = ["EASY", "MEDIUM", "HARD"];

export const PASS_THRESHOLD_DEFAULT = 75;

export const TIMER_WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes in ms

export const ATTEMPT_STATUS = {
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
  GRADED: "GRADED",
};
