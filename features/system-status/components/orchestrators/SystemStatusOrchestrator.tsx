"use client";

import { SystemStatusPresenter } from "@/features/system-status/components/presenters/SystemStatusPresenter";
import { useSystemStatus } from "@/features/system-status/hooks/useSystemStatus";

export function SystemStatusOrchestrator() {
  const { data, isError } = useSystemStatus();

  const label = data
    ? `Service ${data.service}: ${data.status}`
    : isError
      ? "Status unavailable"
      : "Checking status";

  return <SystemStatusPresenter label={label} ok={Boolean(data)} />;
}
