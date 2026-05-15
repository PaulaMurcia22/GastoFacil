import {
  type CreateExpensePayload,
  type CreateExpenseResponse,
  type ExpenseCategoriesResponse,
  type ExpenseDetailResponse,
  type ExpenseListResponse,
} from "./expense.types";

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

export async function fetchExpenseCategories(): Promise<ExpenseCategoriesResponse> {
  const response = await fetch(`${API_BASE_URL}/expenses/categories`, {
    credentials: "include",
  });

  return ensureSuccess<ExpenseCategoriesResponse>(
    response,
    "No fue posible cargar las categorias de gastos.",
  );
}

export async function fetchExpenses(): Promise<ExpenseListResponse> {
  const response = await fetch(`${API_BASE_URL}/expenses`, {
    credentials: "include",
  });

  return ensureSuccess<ExpenseListResponse>(
    response,
    "No fue posible cargar la lista de gastos.",
  );
}

export async function fetchExpenseDetail(
  id: string,
): Promise<ExpenseDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    credentials: "include",
  });

  return ensureSuccess<ExpenseDetailResponse>(
    response,
    "No fue posible cargar el detalle del gasto.",
  );
}

export async function createExpense(
  payload: CreateExpensePayload,
): Promise<CreateExpenseResponse> {
  const response = await fetch(`${API_BASE_URL}/expenses`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return ensureSuccess<CreateExpenseResponse>(
    response,
    "No fue posible registrar el gasto.",
  );
}

export async function updateExpense(
  id: string,
  payload: CreateExpensePayload,
): Promise<CreateExpenseResponse> {
  const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return ensureSuccess<CreateExpenseResponse>(
    response,
    "No fue posible actualizar el gasto.",
  );
}

export async function deleteExpense(id: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  return ensureSuccess<{ message: string }>(
    response,
    "No fue posible eliminar el gasto.",
  );
}