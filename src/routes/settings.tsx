import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type {
  OpenAiApiProviderRead,
  OpenAiApiProviderCreate,
  OpenAiApiProviderUpdate,
  OpenAiApiKeyRead,
  OpenAiApiKeyCreate,
  OpenAiApiKeyUpdate,
  OpenAiApiModelRead,
  OpenAiModelUpdate,
} from "@/types/api";
import { apiConfig } from "@/apiConfig";
import { replaceStringCenterWithEllipsis } from "@/utils";
import styles from "./settings.module.css";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const { data: providers } = useQuery({
    queryKey: ["providers"],
    queryFn: getProviders,
  });
  const { data: keys } = useQuery({
    queryKey: ["keys"],
    queryFn: getKeys,
  });

  const { data: models } = useQuery({
    queryKey: ["models"],
    queryFn: getModels,
  });
  const [selectedProviderId, setSelectedProviderId] = useState<number>(1);
  const selectedProvider: OpenAiApiProviderRead | undefined =
    providers && providers.length > 0
      ? providers.find((p) => p.id === selectedProviderId)
      : undefined;
  const activeKey = keys?.find(
    (key) => key.provider_id === selectedProviderId && key.active
  );

  const updateKeyMutation = useMutation({
    mutationFn: updateKey,
    onMutate: (variables) => {
      if (variables.key.active) {
        queryClient.setQueryData(
          ["keys"],
          (old: OpenAiApiKeyRead[] | undefined) => {
            if (!old) return old;
            const providerId = old.find(
              (k) => k.id === variables.id
            )?.provider_id;
            if (!providerId) return old;
            return old.map((k) =>
              k.provider_id === providerId
                ? { ...k, active: k.id === variables.id }
                : k
            );
          }
        );
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["keys"],
        (old: OpenAiApiKeyRead[] | undefined) => {
          if (!old) return old;
          return old.map((key) => (key.id === data.id ? data : key));
        }
      );
    },
  });

  const refreshModelsMutation = useMutation({
    mutationFn: refreshModels,
    onMutate: (variables) => {
      queryClient.setQueryData(
        ["models"],
        (old: OpenAiApiModelRead[] | undefined) => {
          if (!old) return old;
          return old.filter((model) => model.provider_id !== variables.pid);
        }
      );
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["models"],
        (old: OpenAiApiModelRead[] | undefined) => {
          if (!old) return data;
          return [...old, ...data];
        }
      );
    },
  });

  const updateModelMutation = useMutation({
    mutationFn: updateModel,
    onMutate: (variables) => {
      queryClient.setQueryData(
        ["models"],
        (old: OpenAiApiModelRead[] | undefined) => {
          if (!old) return old;
          return old.map((model) =>
            model.id === variables.id ? { ...model, ...variables.model } : model
          );
        }
      );
    },
  });

  return (
    <div className={styles.settingsContainer}>
      <h2>OpenAI API Providers</h2>
      <select
        className={styles.providerSelector}
        value={selectedProvider?.id}
        onChange={(e) =>
          setSelectedProviderId(
            providers?.find((p) => p.id === Number(e.target.value))?.id ?? 1
          )
        }
      >
        {providers?.map((provider) => {
          return (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          );
        })}
      </select>
      <h3>{selectedProvider?.name} API Keys</h3>
      <select
        className={styles.keySelector}
        value={activeKey?.id}
        onChange={(e) => {
          updateKeyMutation.mutate({
            id: Number(e.target.value),
            key: { active: true },
          });
        }}
      >
        {keys
          ?.filter((key) => key.provider_id === selectedProviderId)
          .map((key) => {
            return (
              <option key={key.id} value={key.id}>
                {replaceStringCenterWithEllipsis(key.key, 12, 7)}
              </option>
            );
          })}
      </select>
      <h3>Available Models</h3>
      <button
        className={styles.modelsRefreshButton}
        onClick={() => {
          refreshModelsMutation.mutate({
            pid: selectedProviderId,
          });
        }}
      >
        Refresh
      </button>
      <ul className={styles.modelsList}>
        {models
          ?.filter((model) => model.provider_id === selectedProviderId)
          .map((model) => (
            <li key={model.id} className={styles.modelItem}>
              <input
                type="checkbox"
                checked={model.bookmarked}
                onChange={() => {
                  updateModelMutation.mutate({
                    id: model.id,
                    model: { bookmarked: !model.bookmarked },
                  });
                }}
              />{" "}
              <span>{model.name}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}

async function getProviders(): Promise<OpenAiApiProviderRead[]> {
  const res = await fetch(`${apiConfig.HTTP_URL}/openai-api-providers`);
  if (!res.ok) throw new Error("Failed to get providers");
  return res.json();
}

async function createProvider(
  provider: OpenAiApiProviderCreate
): Promise<OpenAiApiKeyRead> {
  const res = await fetch(`${apiConfig.HTTP_URL}/openai-api-providers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(provider),
  });
  if (!res.ok) throw new Error("Failed to create provider");
  return res.json();
}

async function updateProvider(
  pid: number,
  provider: OpenAiApiProviderUpdate
): Promise<OpenAiApiProviderUpdate> {
  const res = await fetch(`${apiConfig.HTTP_URL}/openai-api-providers/${pid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(provider),
  });
  if (!res.ok) throw new Error("Failed to update provider");
  return res.json();
}

async function deleteProvider(pid: number): Promise<void> {
  const res = await fetch(`${apiConfig.HTTP_URL}/openai-api-providers/${pid}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete provider");
}

async function getKeys(): Promise<OpenAiApiKeyRead[]> {
  const res = await fetch(`${apiConfig.HTTP_URL}/openai-api-keys`);
  if (!res.ok) throw new Error("Failed to fetch keys");
  return res.json();
}

async function createKey(
  pid: number,
  key: OpenAiApiKeyCreate
): Promise<OpenAiApiKeyRead> {
  const res = await fetch(
    `${apiConfig.HTTP_URL}/openai-api-providers/${pid}/keys`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(key),
    }
  );
  if (!res.ok) throw new Error("Failed to create key");
  return res.json();
}

async function updateKey({
  id,
  key,
}: {
  id: number;
  key: OpenAiApiKeyUpdate;
}): Promise<OpenAiApiKeyRead> {
  const res = await fetch(`${apiConfig.HTTP_URL}/openai-api-keys/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(key),
  });
  if (!res.ok) throw new Error("Failed to update key");
  return res.json();
}

async function deleteKey(id: number): Promise<void> {
  const res = await fetch(`${apiConfig.HTTP_URL}/openai-api-keys/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete API key");
}

async function getModels(): Promise<OpenAiApiModelRead[]> {
  const res = await fetch(`${apiConfig.HTTP_URL}/openai-api-models`);
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}

async function refreshModels({
  pid,
}: {
  pid: number;
}): Promise<OpenAiApiModelRead[]> {
  const url = new URL(
    `${apiConfig.HTTP_URL}/openai-api-providers/${pid}/models/refresh`
  );
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}

async function updateModel({
  id,
  model,
}: {
  id: number;
  model: OpenAiModelUpdate;
}): Promise<OpenAiApiModelRead> {
  const res = await fetch(`${apiConfig.HTTP_URL}/openai-api-models/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(model),
  });
  if (!res.ok) throw new Error("Failed to update model");
  return res.json();
}
