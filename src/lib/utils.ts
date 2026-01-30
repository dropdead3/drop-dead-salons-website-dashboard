import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a display name as "FirstName L." where:
 * - FirstName is the nickname (display_name) if provided, otherwise the first name from full_name
 * - L. is the last initial from full_name
 */
export function formatDisplayName(fullName: string, displayName?: string | null): string {
  if (!fullName?.trim()) return displayName?.trim() || '';
  
  const nameParts = fullName.trim().split(' ');
  const lastInitial = nameParts.length > 1 
    ? ` ${nameParts[nameParts.length - 1].charAt(0).toUpperCase()}.` 
    : '';
  
  // If nickname/display name exists, use that as first name
  if (displayName && displayName.trim()) {
    const nickname = displayName.trim().split(' ')[0]; // Get first word of nickname
    return nickname + lastInitial;
  }
  
  // Otherwise use first name from full name
  const firstName = nameParts[0];
  return firstName + lastInitial;
}

/**
 * Formats a full display name where the first name is replaced by nickname if provided.
 * "Eric Day" with nickname "Johnny" becomes "Johnny Day"
 * "Eric Day" with no nickname stays "Eric Day"
 */
export function formatFullDisplayName(fullName: string, displayName?: string | null): string {
  if (!fullName?.trim()) return displayName?.trim() || '';
  
  const nameParts = fullName.trim().split(' ');
  
  // If nickname exists, use it as the first name
  if (displayName && displayName.trim()) {
    const nickname = displayName.trim().split(' ')[0];
    // Replace first name with nickname, keep the rest
    return [nickname, ...nameParts.slice(1)].join(' ');
  }
  
  return fullName;
}

/**
 * Formats a phone number as (XXX) XXX-XXXX
 * Strips non-digits and applies formatting progressively as user types
 */
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
