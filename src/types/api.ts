export interface GoalRead {
  id: number;
  title: string;
  description: string;
}

export interface GoalCreate {
  title: string;
  description: string;
}

export interface GoalUpdate {
  title?: string;
  description?: string;
}

export interface OpenAiApiProviderRead {
  id: number;
  name: string;
  base_url: string;
}

export interface OpenAiApiProviderCreate {
  name: string;
  base_url: string;
}

export interface OpenAiApiProviderUpdate {
  name?: string;
  base_url?: string;
}

export interface OpenAiApiKeyRead {
  id: number;
  key: string;
  provider_id: number;
  active: boolean;
}

export interface OpenAiApiKeyCreate {
  key: string;
}

export interface OpenAiApiKeyUpdate {
  active?: boolean;
}

export interface OpenAiApiModelRead {
  id: number;
  name: string;
  provider_id: number;
  bookmarked: boolean;
}

export interface OpenAiModelUpdate {
  bookmarked?: boolean;
}
