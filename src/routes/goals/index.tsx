import { useState, useMemo, useCallback, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useQueryClient,
  useQuery,
  useMutation,
  type UseMutationResult,
} from "@tanstack/react-query";
import { apiConfig } from "@/apiConfig";
import { openaiApiModelsQueryOptions } from "@/queries/useOpenAiApiModels";
import { openaiApiProvidersQueryOptions } from "@/queries/useOpenAiApiProviders";
import type {
  GoalRead,
  GoalCreate,
  GoalUpdate,
  JobRead,
  StrategyGenerationRequest,
  OpenAiApiModelRead,
} from "@/types/api";
import { useJobMutation } from "@/mutations/useJobMutation";
import { useGoals } from "@/queries/useGoals";
import { useGoalsMetadata } from "@/queries/useGoalsMetadata";
import Modal from "@/components/Modal";
import styles from "./index.module.css";
import sharedStyles from "@/styles/shared.module.css";

export const Route = createFileRoute("/goals/")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<"create" | "update" | "strategy" | null>(
    null
  );
  const [goalSelected, setGoalSelected] = useState<GoalRead | null>(null);

  const { data: goals } = useGoals();

  const { data: metadata } = useGoalsMetadata();

  const goalsWithMetadata = useMemo(() => {
    if (!goals || !metadata) return [];

    const metadataByGoalId = new Map(metadata.map((m) => [m.goal_id, m]));

    return goals
      .filter((goal) => metadataByGoalId.has(goal.id))
      .map((goal) => ({ ...goal, ...metadataByGoalId.get(goal.id) }));
  }, [goals, metadata]);

  const updateGoalMutation = useMutation({
    mutationFn: updateGoal,
    onSuccess: (updatedGoal) => {
      queryClient.setQueryData<GoalRead[]>(["goals"], (goals) =>
        goals?.map((goal) => (goal.id === updatedGoal.id ? updatedGoal : goal))
      );
    },
  });

  const { mutation: generateStrategyMutation, jobIsPending } = useJobMutation({
    mutationFn: generateStrategy,
    onJobDone: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: (goal) => {
      queryClient.setQueryData<GoalRead[]>(["goals"], (goals) =>
        goals ? [...goals, goal] : goals
      );
      queryClient.invalidateQueries({ queryKey: ["goals", "metadata"] });
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

  return (
    <div className={sharedStyles.contentContainer}>
      <button
        className={styles.createGoalButton}
        onClick={() => setModal("create")}
      >
        Create Goal
      </button>
      {goalsWithMetadata.map((goal) => (
        <div
          className={styles.goalItem}
          data-has-strategy={goal.has_strategy}
          key={goal.id}
        >
          <div className={styles.goalHeader}>
            <Link
              to={"/goals/$goalId"}
              params={{ goalId: goal.id }}
              className={styles.goalLink}
            >
              <h2>{goal.title}</h2>
            </Link>
            <div className={styles.goalHeaderButtonsContainer}>
              <label className={sharedStyles.switch}>
                <input
                  type="checkbox"
                  disabled={!goal.has_strategy}
                  checked={goal.active}
                  onChange={(e) =>
                    updateGoalMutation.mutate({
                      id: goal.id,
                      goal: { ...goal, active: e.target.checked },
                    })
                  }
                />
                <span className={`${sharedStyles.slider}`}></span>
              </label>
              <button
                onClick={() => {
                  setGoalSelected(goal);
                  setModal("strategy");
                }}
                className={styles.generateStrategyButton}
                /* data-has-strategy={goal.has_strategy}
                disabled={jobIsPending} */
              >
                Generate Strategy
              </button>
              <button
                onClick={() => {
                  setGoalSelected(goal);
                  setModal("update");
                }}
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this goal?"))
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
      {modal === "create" && (
        <GoalModal
          close={() => setModal(null)}
          save={(goalFormFields: GoalFormFields) => {
            createGoalMutation.mutate(goalFormFields);
          }}
        />
      )}
      {modal === "update" && goalSelected && (
        <GoalModal
          close={() => {
            setModal(null);
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
      {modal === "strategy" && goalSelected && (
        <GenerateStrategyModal
          goal={goalSelected}
          close={() => {
            setModal(null);
            setGoalSelected(null);
          }}
          generateStrategyMutation={generateStrategyMutation}
        />
      )}
    </div>
  );
}

function selectBookmarkedModels(models: OpenAiApiModelRead[]) {
  return models.filter((model) => model.bookmarked);
}

function GenerateStrategyModal({
  goal,
  close,
  generateStrategyMutation,
}: {
  goal: GoalRead;
  close: () => void;
  generateStrategyMutation: UseMutationResult<
    JobRead,
    Error,
    { id: number; request: StrategyGenerationRequest }
  >;
}) {
  const { data: models } = useQuery({
    ...openaiApiModelsQueryOptions,
    staleTime: Infinity,
    select: selectBookmarkedModels,
  });
  const { data: providers } = useQuery({
    ...openaiApiProvidersQueryOptions,
    staleTime: Infinity,
  });

  const modelsWithProviders = useMemo(() => {
    return models?.map((model) => {
      return {
        ...model,
        provider: providers?.find(
          (provider) => provider.id === model.provider_id
        ),
      };
    });
  }, [models, providers]);

  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const effectiveModelId = selectedModelId ?? models?.[0]?.id;

  return (
    <Modal onClose={close}>
      <div className={styles.modalContainer}>
        <h2>Generate strategy</h2>
        <h3>Select model</h3>
        <select
          value={effectiveModelId}
          onChange={(e) => {
            setSelectedModelId(Number(e.target.value));
          }}
        >
          {modelsWithProviders?.map((model) => {
            return (
              <option key={model.id} value={model.id}>
                {model.provider?.name ?? "Unknown"}
                {"/"}
                {model.name}
              </option>
            );
          })}
        </select>
        <button
          disabled={!effectiveModelId}
          onClick={() => {
            generateStrategyMutation.mutate({
              id: goal.id,
              request: { model_id: effectiveModelId! },
            });
            close();
          }}
        >
          Generate
        </button>
      </div>
    </Modal>
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
    <Modal onClose={close}>
      <div className={styles.modalContainer}>
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

async function generateStrategy({
  id,
  request,
}: {
  id: number;
  request: StrategyGenerationRequest;
}): Promise<JobRead> {
  const res = await fetch(
    `${apiConfig.HTTP_URL}/goals/${id}/strategy:generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }
  );
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}
