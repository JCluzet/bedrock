import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CounterPresenter } from "@/features/landing/components/presenters/CounterPresenter";

describe("CounterPresenter", () => {
  it("shows the count and wires each button to its handler", () => {
    const onIncrement = vi.fn();
    const onDecrement = vi.fn();
    const onReset = vi.fn();

    const { getByLabelText, getByText, container } = render(
      <CounterPresenter
        count={3}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onReset={onReset}
      />,
    );

    expect(container.textContent).toContain("3");

    fireEvent.click(getByLabelText("Increment"));
    fireEvent.click(getByLabelText("Decrement"));
    fireEvent.click(getByText("Reset"));

    expect(onIncrement).toHaveBeenCalledTimes(1);
    expect(onDecrement).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
