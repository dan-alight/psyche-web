import { useQuery } from "@tanstack/react-query";
import { apiConfig } from "@/apiConfig";
import type { GoalMetadata } from "@/types/api";

export const goalsMetadataQueryOptions = {
  queryKey: ["goals","metadata"],
  queryFn: getGoalsMetadata,
};

export function useGoalsMetadata() {
  return useQuery({ ...goalsMetadataQueryOptions });
}

async function getGoalsMetadata(): Promise<GoalMetadata[]> {
  const res = await fetch(`${apiConfig.HTTP_URL}/goals/metadata`);
  if (!res.ok) throw new Error();
  return res.json();
}
