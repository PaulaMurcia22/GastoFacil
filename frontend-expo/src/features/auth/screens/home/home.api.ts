import {
  type AdminDashboardResponse,
  type AdminDashboardUser,
} from "./admin.types";

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

export async function logoutUser(): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function fetchAdminDashboard(): Promise<AdminDashboardResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
    credentials: "include",
  });

  return ensureSuccess<AdminDashboardResponse>(
    response,
    "No fue posible cargar el panel de administrador.",
  );
}

export async function deactivateAdminUser(
  userId: string,
): Promise<{ message: string; users: AdminDashboardUser[] }> {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/deactivate`, {
    method: "PATCH",
    credentials: "include",
  });

  return ensureSuccess<{ message: string; users: AdminDashboardUser[] }>(
    response,
    "No fue posible desactivar el usuario.",
  );
}

export async function promoteAdminUser(
  userId: string,
): Promise<{ message: string; users: AdminDashboardUser[] }> {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/promote`, {
    method: "PATCH",
    credentials: "include",
  });

  return ensureSuccess<{ message: string; users: AdminDashboardUser[] }>(
    response,
    "No fue posible convertir el usuario en administrador.",
  );
}
