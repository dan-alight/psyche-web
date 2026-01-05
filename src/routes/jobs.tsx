import { createFileRoute } from "@tanstack/react-router";
import { useJobs } from "@/hooks/useJobs";

export const Route = createFileRoute("/jobs")({
  component: RouteComponent,
});

function RouteComponent() {
  const jobsQuery = useJobs();
  const jobs = jobsQuery.data ?? [];
  return (
    <div>
      {jobs.map(
        (job) =>
          job && (
            <div key={job.id}>
              Job ID: {job.id}<br/>
              Status: {job.status}
              <div></div>
            </div>
          )
      )}
    </div>
  );
}
