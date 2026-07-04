import { describe, expect, it } from "vitest";

import { useClipboardStore } from "@/features/landing/lib/store";

describe("useClipboardStore", () => {
  it("tracks the last copied command and clears it", () => {
    useClipboardStore.getState().setCopied("pnpm check");
    expect(useClipboardStore.getState().copiedCommand).toBe("pnpm check");

    useClipboardStore.getState().setCopied(null);
    expect(useClipboardStore.getState().copiedCommand).toBeNull();
  });
});
