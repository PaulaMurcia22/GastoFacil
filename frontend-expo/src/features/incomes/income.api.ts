import {
  type CreateIncomePayload,
  type CreateIncomeResponse,
  type IncomeCategoriesResponse,
  type IncomeDetailResponse,
  type IncomeListResponse,
} from "./income.types";

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

export async function fetchIncomeCategories(): Promise<IncomeCategoriesResponse> {
  const response = await fetch(`${API_BASE_URL}/incomes/categories`, {
    credentials: "include",
  });

  return ensureSuccess<IncomeCategoriesResponse>(
    response,
    "No fue posible cargar las categorias de ingresos.",
  );
}

export async function fetchIncomes(): Promise<IncomeListResponse> {
  const response = await fetch(`${API_BASE_URL}/incomes`, {
    credentials: "include",
  });

  return ensureSuccess<IncomeListResponse>(
    response,
    "No fue posible cargar la lista de ingresos.",
  );
}

export async function fetchIncomeDetail(id: string): Promise<IncomeDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/incomes/${id}`, {
    credentials: "include",
  });

  return ensureSuccess<IncomeDetailResponse>(
    response,
    "No fue posible cargar el detalle del ingreso.",
  );
}

export async function createIncome(
  payload: CreateIncomePayload,
): Promise<CreateIncomeResponse> {
  const response = await fetch(`${API_BASE_URL}/incomes`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return ensureSuccess<CreateIncomeResponse>(
    response,
    "No fue posible registrar el ingreso.",
  );
}

export async function updateIncome(
  id: string,
  payload: CreateIncomePayload,
): Promise<CreateIncomeResponse> {
  const response = await fetch(`${API_BASE_URL}/incomes/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return ensureSuccess<CreateIncomeResponse>(
    response,
    "No fue posible actualizar el ingreso.",
  );
}

export async function deleteIncome(id: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/incomes/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  return ensureSuccess<{ message: string }>(
    response,
    "No fue posible eliminar el ingreso.",
  );
}
