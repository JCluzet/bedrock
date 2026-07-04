import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CopyCommandPresenter } from "@/features/landing/components/presenters/CopyCommandPresenter";

describe("CopyCommandPresenter", () => {
  it("shows the command and calls onCopy when clicked", () => {
    const onCopy = vi.fn();
    const { getByRole, container } = render(
      <CopyCommandPresenter command="pnpm check" copied={false} onCopy={onCopy} />,
    );

    expect(container.textContent).toContain("pnpm check");

    fireEvent.click(getByRole("button"));
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("renders in the copied state", () => {
    const { container } = render(
      <CopyCommandPresenter command="pnpm check" copied onCopy={vi.fn()} />,
    );

    expect(container.textContent).toContain("pnpm check");
  });
});
