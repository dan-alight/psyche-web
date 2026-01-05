import { useQuery } from "@tanstack/react-query";
import { apiConfig } from "@/apiConfig";
import type { JobRead } from "@/types/api";

export const jobsQueryOptions = {
  queryKey: ["jobs"],
  queryFn: getAllJobs,
};

export function useJobs() {
  return useQuery<JobRead[]>({
    ...jobsQueryOptions,
    staleTime: 1000 * 60 * 5,
  });
}

async function getAllJobs({
  signal,
}: {
  signal: AbortSignal;
}): Promise<JobRead[]> {
  const res = await fetch(`${apiConfig.HTTP_URL}/jobs`, { signal });
  if (!res.ok) throw new Error("Failed to get all jobs");
  return res.json();
}
