/**
 * Phone Utilities (Malaysia-focused)
 *
 * Purpose:
 * - Accept simple digit input like `01131609008` (no +60 required).
 * - Normalize to a canonical digits-only format for consistent DB lookups.
 */

import { normalizeMyPhone, validatePhone } from '@/lib/utils';

/**
 * Convert a user input phone number to a canonical Malaysian digits format:
 * - Input: "01131609008" -> "601131609008"
 * - Input: "+601131609008" -> "601131609008"
 * - Input: "601131609008" -> "601131609008"
 *
 * @param phone - raw user input
 * @returns canonical digits string (starts with "60")
 */
export function toMyCanonicalPhone(phone: string): string {
  const digits = normalizeMyPhone(phone);
  if (digits.startsWith('60')) return digits;
  if (digits.startsWith('0')) return `60${digits.slice(1)}`;
  return digits;
}

/**
 * Validate phone input for Malaysia rules used in this project.
 *
 * @param phone - raw user input
 */
export function isValidMyPhone(phone: string): boolean {
  return validatePhone(normalizeMyPhone(phone));
}

/**
 * Format canonical digits as E.164 for SMS sending.
 *
 * @param canonicalDigits - e.g. "601131609008"
 * @returns E.164 string, e.g. "+601131609008"
 */
export function toE164(canonicalDigits: string): string {
  const digits = normalizeMyPhone(canonicalDigits);
  return digits ? `+${digits}` : '';
}

