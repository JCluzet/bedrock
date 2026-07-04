import { Badge } from "@/components/ui/badge";

import type { SolidPrinciple } from "@/features/landing/lib/content";

interface SolidSectionProps {
  principles: SolidPrinciple[];
}

export function SolidSection({ principles }: SolidSectionProps) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="font-display text-sm font-semibold tracking-widest text-muted-foreground uppercase">
        SOLID, by construction
      </h2>
      <div className="flex flex-col gap-3">
        {principles.map((principle) => (
          <div key={principle.letter} className="flex items-start gap-4">
            <Badge className="mt-0.5 size-8 justify-center rounded-md text-base font-bold">
              {principle.letter}
            </Badge>
            <div className="flex flex-col">
              <h3 className="font-display text-base font-semibold">{principle.title}</h3>
              <p className="text-sm text-muted-foreground">{principle.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
