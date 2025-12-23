import { format, formatDistance, parseISO } from 'date-fns';

/**
 * Format date to readable string
 * @param date - Date string or Date object
 * @param formatStr - Format string (default: 'MMM dd, yyyy')
 */
export function formatDate(date: string | Date | null | undefined, formatStr: string = 'MMM dd, yyyy'): string {
  if (!date) return '-';

  try {
    let dateObj: Date;

    if (typeof date === 'string') {
      // Try parseISO first (for ISO 8601 strings)
      dateObj = parseISO(date);

      // If parseISO fails, try native Date constructor
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }

    if (isNaN(dateObj.getTime())) return '-';
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Date format error:', error, date);
    return '-';
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param date - Date string or Date object
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (isNaN(dateObj.getTime())) return '-';
    return formatDistance(dateObj, new Date(), { addSuffix: true });
  } catch (error) {
    console.error('Relative time format error:', error, date);
    return '-';
  }
}

/**
 * Format currency (MYR)
 * @param amount - Amount in RM
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'RM 0.00';
  }
  return `RM ${Number(amount).toFixed(2)}`;
}

/**
 * Format phone number (Malaysian format)
 * @param phone - Phone number string
 */
export function formatPhone(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format as +60 12-345 6789
  if (cleaned.startsWith('60')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)}-${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  // Format as 012-345 6789
  if (cleaned.length === 10 || cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }

  return phone;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate Malaysian phone number
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Malaysian phone numbers: 10-11 digits starting with 01 or 60
  return /^(601\d{8,9}|01\d{8,9})$/.test(cleaned);
}

/**
 * Normalize Malaysian phone input for consistent validation/storage/display.
 *
 * Supported inputs:
 * - `01131609008`
 * - `601131609008`
 * - `+601131609008`
 *
 * Output:
 * - digits only, either starting with `01` or `60` (no `+`).
 *
 * @param phone - Raw user input
 * @returns Normalized digits or empty string
 */
export function normalizeMyPhone(phone: string): string {
  return String(phone || '').replace(/\D/g, '');
}

/**
 * Validate password strength
 * At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export function isValidPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

// Legacy aliases for auth forms
export const validateEmail = isValidEmail;
export const validatePhone = isValidPhone;
export const validatePassword = isValidPassword;

/**
 * Generate random string (for referral codes, etc.)
 */
export function generateRandomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * 根据 UUID 生成 6 位数字简码（稳定且可读）
 */
export function generateShortCode(id: string | null | undefined): string {
  if (!id) return '000000';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 1000000;
  }
  return hash.toString().padStart(6, '0');
}

/**
 * Validate UUID (v4 compatible)
 * Prevents passing invalid IDs to database queries
 */
export function isValidUUID(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    value
  );
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate days remaining until a date
 * @param date - Target date string or Date object
 * @returns Number of days remaining (0 if expired, null if no date)
 */
export function calculateDaysRemaining(date: string | Date | null): number | null {
  if (!date) return null;

  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  // Set both dates to midnight for accurate day calculation
  targetDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Safe number to fixed decimal places
 * Prevents errors when value is null/undefined/NaN
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string
 */
export function safeToFixed(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.' + '0'.repeat(decimals);
  }
  return Number(value).toFixed(decimals);
}
