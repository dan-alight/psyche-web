import { useQuery } from "@tanstack/react-query";
import { apiConfig } from "@/apiConfig";
import type { OpenAiApiProviderRead } from "@/types/api";

export function useOpenAiApiProviders() {
  return useQuery({
    queryKey: ["providers"],
    queryFn: getProviders,
  });
}

async function getProviders(): Promise<OpenAiApiProviderRead[]> {
  const res = await fetch(`${apiConfig.HTTP_URL}/openai-api-providers`);
  if (!res.ok) throw new Error("Failed to get providers");
  return res.json();
}
