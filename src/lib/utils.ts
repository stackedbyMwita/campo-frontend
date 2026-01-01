import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMoney(amountInCents: number | undefined | null) {
  const value = amountInCents || 0;
  
  // 1. Convert Cents to Whole Units (13000 cents -> 130.00 KES)
  const amountInShillings = value / 100;

  // 2. Format using Kenyan Locale
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInShillings);
}