export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  age: number;
  nickname: string;
  roleId?: number;
}

export interface RegisteredUser {
  id: string;
  fullName: string;
  nickname: string;
  email: string;
  age: number;
  status: number;
  id_rol?: number;
  idRol?: number;
  audit: Record<string, unknown>;
}

export interface RegisterResponse {
  message: string;
  user: RegisteredUser;
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export async function registerUser(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | RegisterResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new Error(data?.message ?? "No fue posible completar el registro.");
  }

  return data as RegisterResponse;
}

export async function createAdminManagedUser(
  payload: RegisterPayload & { roleId: number },
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new Error(data?.message ?? "No fue posible crear el usuario.");
  }

  return { message: data?.message ?? "Usuario creado correctamente." };
}
