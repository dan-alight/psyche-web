import { useQuery } from "@tanstack/react-query";
import { apiConfig } from "@/apiConfig";
import type { OpenAiApiModelRead } from "@/types/api";

export const openaiApiModelsQueryOptions = {
  queryKey: ["models"],
  queryFn: getOpenAiApiModels,
};

export function useOpenAiApiModels() {
  return useQuery<OpenAiApiModelRead[]>({
    ...openaiApiModelsQueryOptions,
  });
}

async function getOpenAiApiModels({
  signal,
}: {
  signal: AbortSignal;
}): Promise<OpenAiApiModelRead[]> {
  const res = await fetch(`${apiConfig.HTTP_URL}/openai-api-models`, {
    signal,
  });
  if (!res.ok) throw new Error("Failed to get models");
  return res.json();
}
