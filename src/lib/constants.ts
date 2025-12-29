/**
 * System-wide constants
 * 
 * Centralized configuration for business logic values.
 * Allows for easier adjustments without modifying core service logic.
 */

export const INVENTORY = {
  // Quantity to deduct when an order is created (Pre-deduction)
  DEDUCT_ON_CREATE: 1,
  
  // Quantity to deduct when an order is completed.
  // CAUTION: Currently set to 11 (likely meters?) for legacy compatibility in completeOrder.
  // Should verify if inventory is tracked by Unit (1) or Length (11m).
  DEDUCT_ON_COMPLETE: 11,
  
  // Low stock threshold for triggering alerts
  LOW_STOCK_THRESHOLD: 5,
} as const;

export const PRICING = {
  // Base labor/service price when not specified by inventory
  DEFAULT_BASE_PRICE: 35.0,
} as const;

export const ORDER_RULES = {
  // Minimum tension allowed
  MIN_TENSION: 18,
  // Maximum tension allowed
  MAX_TENSION: 35, // Updated to match validation in createMultiRacketOrder
  // Minimum tension difference between vertical and horizontal
  MIN_TENSION_DIFF: 1,
  // Maximum tension difference between vertical and horizontal
  MAX_TENSION_DIFF: 3,
} as const;

export const POINTS = {
  // Percentage of order value awarded as points (e.g., 0.5 = 50%)
  REWARD_RATE: 0.5,
} as const;
