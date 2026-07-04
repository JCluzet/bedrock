import { RiCheckLine, RiFileCopyLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";

interface CopyCommandPresenterProps {
  command: string;
  copied: boolean;
  onCopy: () => void;
}

export function CopyCommandPresenter({
  command,
  copied,
  onCopy,
}: CopyCommandPresenterProps) {
  return (
    <Button variant="outline" onClick={onCopy} className="gap-2 font-mono">
      {copied ? (
        <RiCheckLine className="size-4" />
      ) : (
        <RiFileCopyLine className="size-4" />
      )}
      {command}
    </Button>
  );
}
