export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  age: number;
  nickname: string;
}

export interface RegisteredUser {
  id: string;
  fullName: string;
  nickname: string;
  email: string;
  age: number;
  status: number;
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
