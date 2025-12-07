export interface GoalRead {
  id: number;
  title: string;
  description: string | null;
}

export interface GoalCreate {
  title: string;
  description: string | null;
}

export interface GoalUpdate {
  title?: string;
  description?: string | null;
}
