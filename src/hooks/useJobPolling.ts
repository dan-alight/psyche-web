import { useEffect, useMemo } from "react";
import { useQueryClient, useQuery, skipToken } from "@tanstack/react-query";
import { apiConfig } from "@/apiConfig";
import { useJobs } from "@/queries/useJobs";
import type { JobBatchRequest, JobRead } from "@/types/api";

export function useJobPolling() {
  const queryClient = useQueryClient();
  const jobsQuery = useJobs();
  const jobs = jobsQuery.data ?? [];
  const pendingIds = useMemo(() => {
    return jobs
      .filter((job) => job.status === "pending")
      .map((job) => job.id)
      .sort();
  }, [jobs]);

  const polledJobsQuery = useQuery<JobRead[]>({
    queryKey: ["jobs", "poll"],
    queryFn:
      pendingIds.length > 0
        ? () => getJobBatch({ job_ids: pendingIds })
        : skipToken,
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const updates = polledJobsQuery.data;
    if (!updates) return;
    queryClient.setQueryData<JobRead[]>(["jobs"], (oldData) => {
      if (!oldData) return oldData;
      let hasChanges = false;
      const newData = oldData.map((job) => {
        const update = updates.find((u) => u.id === job.id);
        if (update && update.status !== job.status) {
          hasChanges = true;
          return update;
        }
        return job;
      });
      return hasChanges ? newData : oldData;
    });
  }, [polledJobsQuery.data, queryClient]);

  return { jobs };
}

async function getJobBatch(
  job_batch_request: JobBatchRequest
): Promise<JobRead[]> {
  const res = await fetch(`${apiConfig.HTTP_URL}/jobs/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(job_batch_request),
  });
  if (!res.ok) throw new Error("Failed to fetch job batch");
  return res.json();
}
