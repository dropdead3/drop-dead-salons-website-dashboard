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
