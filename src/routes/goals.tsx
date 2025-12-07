import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { apiConfig } from "@/apiConfig";
import type { GoalRead, GoalCreate, GoalUpdate } from "@/types/api";

export const Route = createFileRoute("/goals")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const { data: goals } = useQuery<GoalRead[]>({
    queryKey: ["goals"],
    queryFn: fetchGoals,
  });

  const createGoalMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: (goal) => {
      queryClient.setQueryData<GoalRead[]>(["goals"], (goals = []) => [
        ...goals,
        goal,
      ]);
    },
  });

  return (
    <div>
      <button
        onClick={() =>
          createGoalMutation.mutate({ title: "New Goal", description: null })
        }
      >
        Create Goal
      </button>
      {goals?.map((goal) => (
        <div key={goal.id}>{goal.title}</div>
      ))}
    </div>
  );
}

async function fetchGoals(): Promise<GoalRead[]> {
  const res = await fetch(`${apiConfig.HTTP_URL}/goals`);
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

async function createGoal(goal: GoalCreate): Promise<GoalRead> {
  const res = await fetch(`${apiConfig.HTTP_URL}/goals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(goal),
  });
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}
