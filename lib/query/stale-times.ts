/**
 * Named client-cache stale windows for TanStack Query. Hooks reference these
 * instead of magic numbers (enforced by the `no-magic-stale-time` guardrail).
 * See .agents/rules/state.md#staletime.
 */
export const STALE = {
  realtime: 0,
  frequent: 30_000, // 30s
  standard: 5 * 60_000, // 5min
  static: 60 * 60_000, // 1h
} as const;
