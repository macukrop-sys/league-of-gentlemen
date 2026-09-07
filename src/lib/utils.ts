import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class lists, last-write-wins on conflicting utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 1 -> "+1.0", -3.4 -> "-3.4", 0 -> "0.0" */
export function formatSigned(n: number, digits = 1) {
  const v = n.toFixed(digits);
  return n > 0 ? `+${v}` : v;
}

export function formatPct(n: number, digits = 0) {
  return `${(n * 100).toFixed(digits)}%`;
}

export function formatPoints(n: number, digits = 1) {
  return n.toFixed(digits);
}

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
