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
