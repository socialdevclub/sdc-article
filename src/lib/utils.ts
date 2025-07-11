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

/**
 * HTML 문자열을 plain text로 변환해요
 * @param html HTML 형태의 문자열
 * @returns HTML 태그가 제거된 텍스트
 */
export const htmlToPlainText = (html: string): string => {
  if (!html) return '';
  
  // DOMParser를 사용해서 HTML을 파싱해요
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // textContent로 텍스트만 추출해요
  const plainText = doc.body.textContent || '';
  
  // 연속된 공백과 줄바꿈을 정리해요
  return plainText
    .replace(/\s+/g, ' ') // 연속된 공백을 하나로 합쳐요
    .trim(); // 앞뒤 공백을 제거해요
};