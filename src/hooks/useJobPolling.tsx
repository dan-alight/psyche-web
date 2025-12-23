import { useQuery, skipToken } from "@tanstack/react-query";
import { apiConfig } from "@/apiConfig";
import type { JobRead } from "@/types/api";

export function useJobPolling({ jobId }: { jobId: number | null }) {
  return useQuery<JobRead>({
    queryKey: ["job", jobId],
    queryFn: jobId ? () => getJob(jobId) : skipToken,
    refetchInterval: (query) => {
      if (query.state.error) return false;
      const data = query.state.data;      
      if (!data) return 1000;
      return data.status === "completed" || data.status === "failed"
        ? false
        : 2000;
    },
    refetchIntervalInBackground: true,
  });
}

async function getJob(jobId: number) : Promise<JobRead> {
  console.log(`Polling job with ID: ${jobId}`);
  const res = await fetch(`${apiConfig.HTTP_URL}/jobs/${jobId}`);
  if (!res.ok) throw new Error("Failed to fetch job");
  return res.json();
}
