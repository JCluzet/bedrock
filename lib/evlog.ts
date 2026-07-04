import { createFsDrain } from "evlog/fs";
import { createEvlog } from "evlog/next";

const isDev = process.env.NODE_ENV === "development";

// Single point of change for structured logging. Swap the drain (fs, HTTP, a
// third-party sink) here and nothing else in the app needs to change.
function buildDrain() {
  if (isDev) return createFsDrain({ dir: ".evlog/logs", maxFiles: 14 });
  return undefined;
}

const drain = buildDrain();

export const { withEvlog, useLogger, log, createError } = createEvlog({
  service: "app",
  ...(drain && { drain }),
});

// --- Safe logger for DI / testable functions ---
// useLogger() throws when called outside a withEvlog() request context (e.g. in
// unit tests). This helper falls back to a no-op logger so handler functions
// work in both contexts.

interface SafeLogger {
  set: (fields: Record<string, unknown>) => void;
  error: (error: unknown) => void;
}

const noop = Function.prototype as () => void;
const noopLogger: SafeLogger = { set: noop, error: noop };

export function tryUseLogger(): SafeLogger {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- evlog server logger, not a React hook
    return useLogger() as unknown as SafeLogger; // nosemgrep: no-as-unknown-as -- narrow boundary cast at the logging seam; shape verified by SafeLogger
  } catch {
    return noopLogger;
  }
}
