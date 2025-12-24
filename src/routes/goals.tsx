import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { apiConfig } from "@/apiConfig";
import type { GoalRead, GoalCreate, GoalUpdate } from "@/types/api";
import Modal from "@/components/Modal";
import styles from "./goals.module.css";

export const Route = createFileRoute("/goals")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const [goalModal, setGoalModal] = useState<"create" | "update" | "none">(
    "none"
  );
  const [goalSelected, setGoalSelected] = useState<GoalRead | null>(null);

  const { data: goals } = useQuery<GoalRead[]>({
    queryKey: ["goals"],
    queryFn: fetchGoals,
  });

  const createGoalMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: (goal) => {
      queryClient.setQueryData<GoalRead[]>(["goals"], (goals = []) => [
        ...goals,
        goal,
      ]);
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: updateGoal,
    onSuccess: (updatedGoal) => {
      queryClient.setQueryData<GoalRead[]>(["goals"], (goals = []) =>
        goals.map((goal) => (goal.id === updatedGoal.id ? updatedGoal : goal))
      );
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: (_, id) => {
      queryClient.setQueryData<GoalRead[]>(["goals"], (goals = []) =>
        goals.filter((goal) => goal.id !== id)
      );
    },
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
                className={styles.goalHeaderButton}
                onClick={() => {
                  setGoalSelected(goal);
                  setGoalModal("update");
                }}
              >
                Edit
              </button>
              <button
                className={styles.goalHeaderButton}
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
          close={() => setGoalModal("none")}
          save={(goalFormFields: GoalFormFields) => {
            createGoalMutation.mutate({
              title: goalFormFields.title,
              description: goalFormFields.description,
            });
          }}
        />
      )}
      {goalModal === "update" && goalSelected && (
        <GoalModal
          close={() => {
            setGoalModal("none");
            setGoalSelected(null);
          }}
          goal={goalSelected}
          save={(goalFormFields: GoalFormFields) => {
            updateGoalMutation.mutate({
              id: goalSelected.id,
              goal: {
                title: goalFormFields.title,
                description: goalFormFields.description,
              },
            });
          }}
        />
      )}
    </div>
  );
}

interface GoalFormFields {
  title: string;
  description: string;
}

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
  });

  return (
    <Modal>
      <div>
        <h2>{goal ? "Edit Goal" : "New Goal"}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(goalFormFields);
            close();
          }}
        >
          <label>
            Title:
            <input
              value={goalFormFields.title}
              onChange={(e) =>
                setGoalFormFields({ ...goalFormFields, title: e.target.value })
              }
              required
            />
          </label>
          <label>
            Description:
            <textarea
              value={goalFormFields.description}
              onChange={(e) =>
                setGoalFormFields({
                  ...goalFormFields,
                  description: e.target.value,
                })
              }
            />
          </label>
          <button type="submit">Save</button>
          <button type="button" onClick={close}>
            Cancel
          </button>
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
