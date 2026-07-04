import { RiCheckboxCircleLine } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

interface SystemStatusPresenterProps {
  label: string;
  ok: boolean;
}

export function SystemStatusPresenter({ label, ok }: SystemStatusPresenterProps) {
  return (
    <Badge variant="outline" className={cn("gap-1.5", !ok && "opacity-70")}>
      <RiCheckboxCircleLine className="size-3.5" />
      {label}
    </Badge>
  );
}
