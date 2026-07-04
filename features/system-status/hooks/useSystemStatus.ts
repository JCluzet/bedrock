import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { exampleKeys } from "@/lib/query/keys";
import { STALE } from "@/lib/query/stale-times";

const statusSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
});

export type SystemStatus = z.infer<typeof statusSchema>;

export function useSystemStatus() {
  return useQuery({
    // Keys come from a typed factory, never an inline array.
    queryKey: exampleKeys.detail("system-status"),
    queryFn: async (): Promise<SystemStatus> => {
      const response = await fetch("/api/health");
      // Validate at the boundary: the network shape is unknown until parsed.
      const payload: unknown = await response.json();
      return statusSchema.parse(payload);
    },
    // Cache window from a named profile, never a magic number.
    staleTime: STALE.standard,
  });
}
