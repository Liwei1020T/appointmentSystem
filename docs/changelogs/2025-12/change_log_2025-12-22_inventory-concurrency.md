# Change Log — 2025-12-22

## Summary
Hardened inventory deductions to be atomic so concurrent orders cannot drive stock below zero.

## Changes
- Updated `src/actions/orders.actions.ts` to atomically decrement stock during order creation and order completion using conditional updates.
- Added guards that throw when stock is insufficient at commit time to prevent oversell.

## Tests
- Manual: place two simultaneous orders against a 1-unit stock item → one succeeds, one returns “库存不足”.
