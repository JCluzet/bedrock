import { RiBookOpenLine, RiGithubFill } from "@remixicon/react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface HeroActionsProps {
  docsUrl: string;
  repoUrl: string;
  primaryCta: string;
  copyControl: ReactNode;
}

export function HeroActions({
  docsUrl,
  repoUrl,
  primaryCta,
  copyControl,
}: HeroActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button asChild className="gap-2">
        <Link href={docsUrl} target="_blank" rel="noreferrer">
          <RiBookOpenLine className="size-4" />
          {primaryCta}
        </Link>
      </Button>
      <Button asChild variant="outline" className="gap-2">
        <Link href={repoUrl} target="_blank" rel="noreferrer">
          <RiGithubFill className="size-4" />
          GitHub
        </Link>
      </Button>
      {copyControl}
    </div>
  );
}
