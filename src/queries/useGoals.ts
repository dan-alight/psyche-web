import { useQuery } from "@tanstack/react-query";
import { apiConfig } from "@/apiConfig";
import type { GoalRead } from "@/types/api";

export const goalsQueryOptions = {
  queryKey: ["goals"],
  queryFn: getGoals,
};

export function useGoals() {
  return useQuery({ ...goalsQueryOptions });
}

async function getGoals(): Promise<GoalRead[]> {
  const res = await fetch(`${apiConfig.HTTP_URL}/goals`);
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}
