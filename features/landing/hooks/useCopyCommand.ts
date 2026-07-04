import { useCallback } from "react";

import { useClipboardStore } from "@/features/landing/lib/store";

export function useCopyCommand(command: string) {
  const copiedCommand = useClipboardStore((state) => state.copiedCommand);
  const setCopied = useClipboardStore((state) => state.setCopied);

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(command).then(() => {
      setCopied(command);
    });
  }, [command, setCopied]);

  return { copied: copiedCommand === command, copy };
}
