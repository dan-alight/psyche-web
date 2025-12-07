import { createFileRoute } from "@tanstack/react-router";
import styles from "./calendar.module.css";

export const Route = createFileRoute("/calendar")({
  component: RouteComponent,
});

function RouteComponent() {
  const nums = Array.from({ length: 100 }, (_, i) => i + 1);
  return (
    <>
      <div className={styles.calendarContainer}>
        {nums.map((num, i) => (
          <div key={i}>{num}</div>
        ))}
      </div>
    </>
  );
}
