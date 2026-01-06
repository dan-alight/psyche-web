export interface GoalRead {
  id: number;
  title: string;
  description: string;
  initial_progress: string;
  strategy_guidelines: string;
}

export interface GoalCreate {
  title: string;
  description: string;
  initial_progress: string;
  strategy_guidelines: string;
}

export type GoalUpdate = Partial<GoalCreate>;

export interface OpenAiApiProviderRead {
  id: number;
  name: string;
  base_url: string;
}

export interface OpenAiApiProviderCreate {
  name: string;
  base_url: string;
}

export type OpenAiApiProviderUpdate = Partial<OpenAiApiKeyCreate>;

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

export interface JobRead {
  id: number;
  status: "pending" | "done" | "error";
  info?: string;
}

export interface ActivityRead {
  id: number;
  description: string;
  date: string; // ISO date string
}

export interface CalendarGenerationRequest {
  // pass
}

export interface StrategyGenerationRequest {
  model_id: number;
}

export interface JobBatchRequest {
  job_ids: number[];
}
