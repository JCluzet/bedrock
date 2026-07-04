import { describe, expect, it } from "vitest";

import { createError, tryUseLogger } from "@/lib/evlog";

describe("evlog", () => {
  it("createError carries the user message", () => {
    const error = createError({
      status: 400,
      message: "Invalid input",
      why: "The payload failed schema validation",
      fix: "Send a body matching the documented shape",
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Invalid input");
  });

  it("tryUseLogger returns a no-op logger outside a request context", () => {
    const logger = tryUseLogger();

    expect(() => {
      logger.set({ userId: "abc" });
      logger.error(new Error("boom"));
    }).not.toThrow();
  });
});
