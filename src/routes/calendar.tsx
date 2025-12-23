import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useJobPolling } from "@/hooks/useJobPolling";
import { useCalendarGenerationJobIdStore } from "@/store/useCalendarGenerationJobIdStore";
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

  const { data: activities, isFetching: isFetchingActivities } = useQuery<
    ActivityRead[]
  >({
    queryKey: ["activities", isoDate],
    queryFn: () => getActivities(isoDate),
  });

  const jobId = useCalendarGenerationJobIdStore(
    (state) => state.calendarGenerationJobIds[isoDate] ?? null
  );
  const setJobId = useCalendarGenerationJobIdStore((state) => state.setJobId);

  const { data: jobRead, isError } = useJobPolling({ jobId: jobId });
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

    setJobId(isoDate, null);
  }, [shouldStopPolling, isJobCompleted, isoDate, queryClient, setJobId]);

  const generateCalendarMutation = useMutation({
    mutationFn: generateCalendar,
    onSuccess: (data) => {
      setJobId(isoDate, data.id);
    },
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

async function generateCalendar(isoDate: string): Promise<JobRead> {
  const url = new URL(`${apiConfig.HTTP_URL}/calendar/generate`);
  url.searchParams.append("date", isoDate);
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
