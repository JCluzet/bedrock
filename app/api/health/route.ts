import { useLogger, withEvlog } from "@/lib/evlog";
import { getAppStatus } from "@/lib/server/status";

// Every route handler is wrapped with withEvlog() so request lifecycle and
// errors land in one structured event (see .agents/rules/logging.md).
export const GET = withEvlog(() => {
  const log = useLogger();
  const status = getAppStatus();

  log.set({ service: status.service });

  return Response.json(status);
});
