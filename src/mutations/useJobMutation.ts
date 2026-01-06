import { useState, useEffect, useRef } from "react";
import {
  useQueryClient,
  useQuery,
  useMutation,
  type UseMutationResult,
} from "@tanstack/react-query";
import type { JobRead } from "@/types/api";
import { jobsQueryOptions } from "@/queries/useJobs";

interface UseJobMutationProps<TVariables> {
  mutationFn: (variables: TVariables) => Promise<JobRead>;
  onJobDone?: () => void;
}

export function useJobMutation<TVariables>({
  mutationFn,
  onJobDone,
}: UseJobMutationProps<TVariables>): UseMutationResult<
  JobRead,
  Error,
  TVariables
> {
  const queryClient = useQueryClient();

  const [trackedJobId, setTrackedJobId] = useState<number | null>(null);

  const onJobDoneRef = useRef(onJobDone);
  useEffect(() => {
    onJobDoneRef.current = onJobDone;
  });

  const { data: trackedJob } = useQuery({
    ...jobsQueryOptions,
    enabled: !!trackedJobId,
    staleTime: Infinity,
    select: (jobs) => jobs.find((job) => job.id === trackedJobId),
  });

  useEffect(() => {
    if (!trackedJob) return;
    if (trackedJob.status === "pending") return;
    if (trackedJob.status === "done") {
      onJobDoneRef.current?.();
    }
    setTrackedJobId(null);
  }, [trackedJob]);

  return useMutation({
    mutationFn: mutationFn,
    onSuccess: async (data) => {
      await queryClient.cancelQueries(
        { queryKey: ["jobs"] },
        { silent: true, revert: false }
      );
      queryClient.setQueryData<JobRead[]>(["jobs"], (oldJobs) => {
        if (!oldJobs) return [data];
        const exists = oldJobs.some((job) => job.id === data.id);
        if (exists) return oldJobs;
        return [...oldJobs, data];
      });
      setTrackedJobId(data.id);
    },
  });
}
