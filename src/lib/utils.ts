import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

declare global {
  interface Window {
    gtag: (event: string, eventName: string, params: Record<string, string>) => void;
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function gtagEvent(event: string, params: Record<string, string>) {
  if (!window) return;
  window.gtag('event', event, params);
}