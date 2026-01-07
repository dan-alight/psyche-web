import { useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { goalsQueryOptions } from "@/queries/useGoals";
import type { GoalMetadata, GoalRead, GoalStrategyRead } from "@/types/api";
import { apiConfig } from "@/apiConfig";
import { goalsMetadataQueryOptions } from "@/queries/useGoalsMetadata";
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

  const selectMetadata = useCallback(
    (goalsMetadata: GoalMetadata[]) =>
      goalsMetadata.find((metadata) => metadata.goal_id == goalId),
    [goalId]
  );

  const { data: metadata } = useQuery({
    ...goalsMetadataQueryOptions,
    select: selectMetadata,
  });

  const { data: goal } = useQuery({ ...goalsQueryOptions, select: selectGoal });

  const { data: strategy } = useQuery({
    queryKey: ["goals", goalId, "strategy"],
    queryFn: () => getStrategy(goalId),
    enabled: !!(metadata?.has_strategy)
  });

  return (
    <div className={sharedStyles.contentContainer}>
      <h1>{goal?.title}</h1>
      <h2>Strategy</h2>
      <p className={styles.strategyText}>{strategy?.strategy}</p>
    </div>
  );
}

async function getStrategy(gid: number): Promise<GoalStrategyRead> {
  const res = await fetch(`${apiConfig.HTTP_URL}/goals/${gid}/strategy`);
  if (!res.ok) throw new Error("Could not get strategy");
  return res.json();
}
