import {
  type AddGoalContributionPayload,
  type CreateGoalPayload,
  type CreateGoalResponse,
  type GoalCategoriesResponse,
  type GoalDetailResponse,
  type GoalListResponse,
  type UpdateGoalContributionPayload,
} from "./goal.types";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

async function readJson<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null;
}

async function ensureSuccess<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const data = await readJson<T | { message?: string }>(response);

  if (!response.ok) {
    const errorMessage =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : fallbackMessage;

    throw new Error(errorMessage);
  }

  return data as T;
}

export async function fetchGoalCategories(): Promise<GoalCategoriesResponse> {
  const response = await fetch(`${API_BASE_URL}/goals/categories`, {
    credentials: "include",
  });

  return ensureSuccess<GoalCategoriesResponse>(
    response,
    "No fue posible cargar las categorias de metas.",
  );
}

export async function fetchGoals(): Promise<GoalListResponse> {
  const response = await fetch(`${API_BASE_URL}/goals`, {
    credentials: "include",
  });

  return ensureSuccess<GoalListResponse>(
    response,
    "No fue posible cargar la lista de metas.",
  );
}

export async function fetchGoalDetail(id: string): Promise<GoalDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
    credentials: "include",
  });

  return ensureSuccess<GoalDetailResponse>(
    response,
    "No fue posible cargar el detalle de la meta.",
  );
}

export async function createGoal(
  payload: CreateGoalPayload,
): Promise<CreateGoalResponse> {
  const response = await fetch(`${API_BASE_URL}/goals`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return ensureSuccess<CreateGoalResponse>(
    response,
    "No fue posible registrar la meta.",
  );
}

export async function updateGoal(
  id: string,
  payload: CreateGoalPayload,
): Promise<CreateGoalResponse> {
  const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return ensureSuccess<CreateGoalResponse>(
    response,
    "No fue posible actualizar la meta.",
  );
}

export async function addGoalContribution(
  goalId: string,
  payload: AddGoalContributionPayload,
): Promise<CreateGoalResponse> {
  const response = await fetch(`${API_BASE_URL}/goals/${goalId}/contributions`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return ensureSuccess<CreateGoalResponse>(
    response,
    "No fue posible registrar el aporte.",
  );
}

export async function updateGoalContribution(
  goalId: string,
  contributionId: string,
  payload: UpdateGoalContributionPayload,
): Promise<CreateGoalResponse> {
  const response = await fetch(
    `${API_BASE_URL}/goals/${goalId}/contributions/${contributionId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  return ensureSuccess<CreateGoalResponse>(
    response,
    "No fue posible actualizar el aporte.",
  );
}

export async function deleteGoal(id: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  return ensureSuccess<{ message: string }>(
    response,
    "No fue posible eliminar la meta.",
  );
}
