import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RolesSection } from "@/features/landing/components/presenters/RolesSection";
import { ROLES } from "@/features/landing/lib/content";

describe("RolesSection", () => {
  it("renders every role", () => {
    const { container } = render(<RolesSection roles={ROLES} />);

    expect(container.textContent).toContain("Orchestrator");
    expect(container.textContent).toContain("Presenter");
    expect(container.textContent).toContain("Hook");
  });
});
