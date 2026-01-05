import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { apiConfig } from "@/apiConfig";
import type { GoalRead, GoalCreate, GoalUpdate, JobRead } from "@/types/api";
import Modal from "@/components/Modal";
import styles from "./goals.module.css";

export const Route = createFileRoute("/goals")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const [goalModal, setGoalModal] = useState<"create" | "update" | null>(null);
  const [goalSelected, setGoalSelected] = useState<GoalRead | null>(null);

  const { data: goals } = useQuery<GoalRead[]>({
    queryKey: ["goals"],
    queryFn: fetchGoals,
  });

  const createGoalMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: (goal) => {
      queryClient.setQueryData<GoalRead[]>(["goals"], (goals) =>
        goals ? [...goals, goal] : goals
      );
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: updateGoal,
    onSuccess: (updatedGoal) => {
      queryClient.setQueryData<GoalRead[]>(["goals"], (goals) =>
        goals?.map((goal) => (goal.id === updatedGoal.id ? updatedGoal : goal))
      );
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: (_, id) => {
      queryClient.setQueryData<GoalRead[]>(["goals"], (goals) =>
        goals?.filter((goal) => goal.id !== id)
      );
    },
  });

  const generateStrategyMutation = useMutation({
    mutationFn: generateStrategy,
  });

  return (
    <div className={styles.goalsContainer}>
      <button
        className={styles.createGoalButton}
        onClick={() => setGoalModal("create")}
      >
        Create Goal
      </button>
      {goals?.map((goal) => (
        <div className={styles.goalItem} key={goal.id}>
          <div className={styles.goalHeader}>
            <h2 className={styles.goalTitle}>{goal.title}</h2>
            <div className={styles.goalHeaderButtonsContainer}>
              <button
                onClick={() => {
                  generateStrategyMutation.mutate(goal.id);
                }}
              >
                Generate Strategy
              </button>
              <button
                onClick={() => {
                  setGoalSelected(goal);
                  setGoalModal("update");
                }}
              >
                Edit
              </button>
              <button
                onClick={() => {
                  deleteGoalMutation.mutate(goal.id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
          <div className={styles.goalDescription}>{goal.description}</div>
        </div>
      ))}
      {goalModal === "create" && (
        <GoalModal
          close={() => setGoalModal(null)}
          save={(goalFormFields: GoalFormFields) => {
            createGoalMutation.mutate(goalFormFields);
          }}
        />
      )}
      {goalModal === "update" && goalSelected && (
        <GoalModal
          close={() => {
            setGoalModal(null);
            setGoalSelected(null);
          }}
          goal={goalSelected}
          save={(goalFormFields: GoalFormFields) => {
            updateGoalMutation.mutate({
              id: goalSelected.id,
              goal: goalFormFields,
            });
          }}
        />
      )}
    </div>
  );
}

type GoalFormFields = GoalCreate;

function GoalModal({
  close,
  save,
  goal,
}: {
  close: () => void;
  save: (fields: GoalFormFields) => void;
  goal?: GoalRead;
}) {
  const [goalFormFields, setGoalFormFields] = useState<GoalFormFields>({
    title: goal ? goal.title : "",
    description: goal ? goal.description : "",
    initial_progress: goal ? goal.initial_progress : "",
    strategy_guidelines: goal ? goal.strategy_guidelines : "",
  });

  return (
    <Modal>
      <div className={styles.goalModalContainer}>
        <h2>{goal ? "Edit Goal" : "New Goal"}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(goalFormFields);
            close();
          }}
          className={styles.goalModalForm}
        >
          <label htmlFor="goal-title">Title</label>
          <input
            id="goal-title"
            type="text"
            placeholder="Title"
            value={goalFormFields.title}
            onChange={(e) =>
              setGoalFormFields({ ...goalFormFields, title: e.target.value })
            }
            required
          />
          <label htmlFor="goal-description">Description</label>
          <textarea
            id="goal-description"
            placeholder="Description"
            value={goalFormFields.description}
            onChange={(e) =>
              setGoalFormFields({
                ...goalFormFields,
                description: e.target.value,
              })
            }
          />
          <label htmlFor="goal-initial-progress">Initial progress</label>
          <textarea
            id="goal-initial-progress"
            placeholder="Initial progress"
            value={goalFormFields.initial_progress}
            onChange={(e) =>
              setGoalFormFields({
                ...goalFormFields,
                initial_progress: e.target.value,
              })
            }
          />
          <label htmlFor="goal-strategy-guidelines">Strategy guidelines</label>
          <textarea
            id="goal-strategy-guidelines"
            placeholder="Strategy guidelines"
            value={goalFormFields.strategy_guidelines}
            onChange={(e) =>
              setGoalFormFields({
                ...goalFormFields,
                strategy_guidelines: e.target.value,
              })
            }
          />

          <div className={styles.goalModalButtonsContainer}>
            <button
              type="button"
              onClick={close}
              className={styles.goalModalCancelButton}
            >
              Cancel
            </button>
            <button type="submit" className={styles.goalModalSaveButton}>
              Save
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

async function fetchGoals(): Promise<GoalRead[]> {
  const res = await fetch(`${apiConfig.HTTP_URL}/goals`);
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

async function createGoal(goal: GoalCreate): Promise<GoalRead> {
  const res = await fetch(`${apiConfig.HTTP_URL}/goals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(goal),
  });
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

async function updateGoal({
  id,
  goal,
}: {
  id: number;
  goal: GoalUpdate;
}): Promise<GoalRead> {
  const res = await fetch(`${apiConfig.HTTP_URL}/goals/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(goal),
  });
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

async function deleteGoal(id: number): Promise<void> {
  const res = await fetch(`${apiConfig.HTTP_URL}/goals/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Network response was not ok");
}

async function generateStrategy(id: number): Promise<JobRead> {
  const res = await fetch(
    `${apiConfig.HTTP_URL}/goals/${id}/strategy:generate`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}
