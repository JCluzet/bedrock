import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SystemStatusPresenter } from "@/features/system-status/components/presenters/SystemStatusPresenter";

describe("SystemStatusPresenter", () => {
  it("renders the label it is given", () => {
    const { container } = render(
      <SystemStatusPresenter label="Service app: ok" ok />,
    );

    expect(container.textContent).toContain("Service app: ok");
  });

  it("renders a muted label when not ok", () => {
    const { container } = render(
      <SystemStatusPresenter label="Status unavailable" ok={false} />,
    );

    expect(container.textContent).toContain("Status unavailable");
  });
});
