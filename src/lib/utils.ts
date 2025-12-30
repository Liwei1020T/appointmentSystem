import { type ClassValue, clsx } from "clsx"
import { format } from "date-fns"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validate UUID v4/v5 string input for API parameter checks.
 */
export function isValidUUID(value: string) {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidPattern.test(value)
}

/**
 * Normalize Malaysian phone input by stripping non-digits.
 */
export function normalizeMyPhone(value: string) {
  return value.replace(/\D/g, '')
}

/**
 * Validate Malaysian phone input (local 0XXXXXXXXX/0XXXXXXXXXX or 60XXXXXXXXX/60XXXXXXXXXX).
 */
export function validatePhone(value: string) {
  const digits = normalizeMyPhone(value)
  if (digits.startsWith('60')) {
    return digits.length === 11 || digits.length === 12
  }
  if (digits.startsWith('0')) {
    return digits.length === 10 || digits.length === 11
  }
  return false
}

/**
 * Validate password strength: >= 8 chars with upper/lowercase letters and numbers.
 */
export function validatePassword(value: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value)
}

/**
 * Format date input with a date-fns pattern.
 */
export function formatDate(
  dateInput?: string | Date | null,
  pattern: string = 'yyyy-MM-dd'
) {
  if (!dateInput) return '-'
  const parsed = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (Number.isNaN(parsed.getTime())) return '-'
  return format(parsed, pattern)
}

/**
 * Format currency values as RM with 2 decimals.
 */
export function formatCurrency(amount: number | string | null | undefined) {
  const value = Number(amount ?? 0)
  if (Number.isNaN(value)) return 'RM 0.00'
  return `RM ${value.toFixed(2)}`
}

/**
 * Calculate remaining days until a target date.
 */
export function calculateDaysRemaining(dateInput?: string | Date | null) {
  if (!dateInput) return 0
  const endDate = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (Number.isNaN(endDate.getTime())) return 0
  const diff = endDate.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/**
 * Generate a short, human-friendly code from an ID.
 */
export function generateShortCode(id?: string | null) {
  if (!id) return '------'
  return id.replace(/-/g, '').slice(0, 6).toUpperCase()
}
