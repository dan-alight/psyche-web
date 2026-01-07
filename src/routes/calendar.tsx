import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as z from "zod";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { jobsQueryOptions } from "@/queries/useJobs";
import type {
  JobRead,
  ActivityRead,
  CalendarGenerationRequest,
} from "@/types/api";
import { localISODateString } from "@/utils";
import { useJobMutation } from "@/mutations/useJobMutation";
import styles from "./calendar.module.css";
import { apiConfig } from "@/apiConfig";

const calendarSearchSchema = z.object({
  date: z.iso
    .date()
    .catch(() => localISODateString())
    .default(() => localISODateString()),
});

export const Route = createFileRoute("/calendar")({
  component: RouteComponent,
  validateSearch: calendarSearchSchema,
});

function RouteComponent() {
  const { date } = Route.useSearch();
  return <CalendarContent isoDate={date} key={date} />;
}

function CalendarContent({ isoDate }: { isoDate: string }) {
  const queryClient = useQueryClient();

  const { data: activities } = useQuery<ActivityRead[]>({
    queryKey: ["activities", isoDate],
    queryFn: () => getActivities(isoDate),
  });

  const { mutation: generateCalendarMutation } = useJobMutation({
    mutationFn: generateCalendar,
    onJobDone: () =>
      queryClient.invalidateQueries({ queryKey: ["activities", isoDate] }),
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
  const url = new URL(`${apiConfig.HTTP_URL}/calendar:generate`);
  url.searchParams.append("date", isoDate);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
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
