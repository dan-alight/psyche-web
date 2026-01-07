import { useQuery } from "@tanstack/react-query";
import { apiConfig } from "@/apiConfig";
import type { OpenAiApiProviderRead } from "@/types/api";

export const openaiApiProvidersQueryOptions = {
  queryKey: ["providers"],
  queryFn: getProviders,
};

export function useOpenAiApiProviders() {
  return useQuery({
    ...openaiApiProvidersQueryOptions,
  });
}

async function getProviders(): Promise<OpenAiApiProviderRead[]> {
  const res = await fetch(`${apiConfig.HTTP_URL}/openai-api-providers`);
  if (!res.ok) throw new Error("Failed to get providers");
  return res.json();
}
