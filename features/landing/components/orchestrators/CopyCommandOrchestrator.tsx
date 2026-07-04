"use client";

import { CopyCommandPresenter } from "@/features/landing/components/presenters/CopyCommandPresenter";
import { useCopyCommand } from "@/features/landing/hooks/useCopyCommand";

export function CopyCommandOrchestrator({ command }: { command: string }) {
  const { copied, copy } = useCopyCommand(command);

  return <CopyCommandPresenter command={command} copied={copied} onCopy={copy} />;
}
