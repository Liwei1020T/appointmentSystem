# Optimization Checkpoint — 2026-01-12

## Achievements
- Live ETA surfaced across the order list chips and booking flow via the new `getOrderEtaEstimate` helper; it now respects backend queue metadata when available and falls back to status-based text.
- Batch photo diagnostics now maintain a retry queue, surface per-slot file names, vibrate on failures, and expose dedicated retry/ignore controls plus durable badges.
- Repeat-order mode can auto-fill photos from the previous order, while the Step 2/4 sticky bar respects safe area insets for a mobile-first feel.

## Next optimization ideas
1. Add API instrumentation so `workQueueEstimate` comes from a real backend queue (queuePosition, start time, estimated days) and surface the raw delta in the ETA chips.
2. Persist manual retry confirmations server-side or in local storage so the retry queue survives reloads until the user explicitly clears it.
3. Integrate motion/haptic options in user preferences so the diagnostic badges can use subtle pulses or vibrations only when the user opts into feedback.
4. Explore “auto-fill template” presets that allow choosing a past order (beyond the most recent) and reusing tensions/notes/photos in one tap.
