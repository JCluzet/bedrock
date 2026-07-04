import { RiShieldCheckLine } from "@remixicon/react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

import type { HeroCopy } from "@/features/landing/lib/content";

interface HeroSectionProps {
  copy: HeroCopy;
  actions: ReactNode;
}

export function HeroSection({ copy, actions }: HeroSectionProps) {
  return (
    <section className="flex flex-col items-start gap-6">
      <Badge variant="secondary" className="gap-1.5">
        <RiShieldCheckLine className="size-3.5" />
        {copy.eyebrow}
      </Badge>
      <h1 className="font-display text-6xl font-bold tracking-tight">{copy.title}</h1>
      <p className="font-display text-2xl font-medium text-muted-foreground">
        {copy.tagline}
      </p>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
        {copy.body}
      </p>
      {actions}
    </section>
  );
}
