import { useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { goalsQueryOptions } from "@/queries/useGoals";
import type { GoalRead } from "@/types/api";
import styles from "./$goalId.module.css";
import sharedStyles from "@/styles/shared.module.css";

export const Route = createFileRoute("/goals/$goalId")({
  component: RouteComponent,
  params: {
    parse: (params) => ({ goalId: Number(params.goalId) }),
  },
});

function RouteComponent() {
  const { goalId } = Route.useParams();

  const selectGoal = useCallback(
    (goals: GoalRead[]) => goals.find((goal) => goal.id === goalId),
    [goalId]
  );

  const { data: goal } = useQuery({ ...goalsQueryOptions, select: selectGoal });

  return (
    <div className={sharedStyles.contentContainer}>
      <h1>{goal?.title}</h1>
    </div>
  );
}
