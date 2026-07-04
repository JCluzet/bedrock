import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SolidSection } from "@/features/landing/components/presenters/SolidSection";
import { SOLID } from "@/features/landing/lib/content";

describe("SolidSection", () => {
  it("renders every SOLID principle", () => {
    const { container } = render(<SolidSection principles={SOLID} />);

    expect(container.textContent).toContain("Single Responsibility");
    expect(container.textContent).toContain("Dependency Inversion");
  });
});
