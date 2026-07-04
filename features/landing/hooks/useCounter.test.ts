import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useCounter } from "@/features/landing/hooks/useCounter";

describe("useCounter", () => {
  it("increments, decrements, and resets", () => {
    const { result } = renderHook(() => useCounter(2));

    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(3);

    act(() => {
      result.current.decrement();
      result.current.decrement();
    });
    expect(result.current.count).toBe(1);

    act(() => {
      result.current.reset();
    });
    expect(result.current.count).toBe(2);
  });
});
