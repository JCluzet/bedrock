import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeroSection } from "@/features/landing/components/presenters/HeroSection";
import { HERO } from "@/features/landing/lib/content";

describe("HeroSection", () => {
  it("renders the hero copy and its slots", () => {
    const { container } = render(
      <HeroSection copy={HERO} actions={<span>actions-slot</span>} />,
    );

    expect(container.textContent).toContain("Bedrock");
    expect(container.textContent).toContain(HERO.tagline);
    expect(container.textContent).toContain("actions-slot");
  });
});
