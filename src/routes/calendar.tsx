import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useJobPolling } from "@/hooks/useJobPolling";
import { useJobStore } from "@/store/useJobStore";
import type {
  JobRead,
  ActivityRead,
  CalendarGenerationRequest,
} from "@/types/api";
import styles from "./calendar.module.css";
import { apiConfig } from "@/apiConfig";

export const Route = createFileRoute("/calendar")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const [isoDate, setIsoDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const { data: activities } = useQuery<ActivityRead[]>({
    queryKey: ["activities", isoDate],
    queryFn: () => getActivities(isoDate),
  });

  const generateCalendarUrlString = getGenerateCalendarUrl(isoDate).toString();

  const storedJob = useJobStore((state) => {
    const jobs = state.jobs[generateCalendarUrlString];
    const job = jobs?.[jobs.length - 1];
    // Only return the defined job if it's pending. Otherwise start a new job.
    if (job === undefined || job.status === "pending") return job;
    return undefined;
  });
  const { addJob } = useJobStore();

  const { data: jobRead, isError } = useJobPolling({ jobId: storedJob?.id });
  const isJobCompleted = jobRead?.status === "completed";
  const isJobFailed = jobRead?.status === "failed";
  const shouldStopPolling = isJobCompleted || isJobFailed || isError;

  useEffect(() => {
    if (!shouldStopPolling) return;
    if (isJobCompleted) {
      queryClient.invalidateQueries({
        queryKey: ["activities", isoDate],
      });
    }
  }, [shouldStopPolling, isJobCompleted, isoDate, queryClient]);

  const generateCalendarMutation = useMutation({
    mutationFn: generateCalendar,
    onSuccess: (data) => addJob(generateCalendarUrlString, data),
  });

  return (
    <>
      <div className={styles.calendarContainer}>
        <button
          className={styles.generateButton}
          onClick={() => generateCalendarMutation.mutate(isoDate)}
        >
          Generate
        </button>
        <div className={styles.dayScheduleContainer}>hello</div>
      </div>
    </>
  );
}

function getGenerateCalendarUrl(isoDate: string): URL {
  const url = new URL(`${apiConfig.HTTP_URL}/calendar:generate`);
  url.searchParams.append("date", isoDate);
  return url;
}

async function generateCalendar(isoDate: string): Promise<JobRead> {
  const url = getGenerateCalendarUrl(isoDate);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ date: isoDate }),
  });
  if (!res.ok) throw new Error("Failed to generate calendar for the date");
  return res.json();
}

async function getActivities(isoDate: string): Promise<ActivityRead[]> {
  const url = new URL(`${apiConfig.HTTP_URL}/calendar/activities`);
  url.searchParams.append("date", isoDate);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch activities");
  return res.json();
}
