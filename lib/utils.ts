import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function linesToArray(input: string) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
