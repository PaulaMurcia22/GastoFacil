import { type HomeData } from "../home/home.types";

export interface LoginPayload {
  email: string;
  password: string;
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export async function loginUser(payload: LoginPayload): Promise<HomeData> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | HomeData
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new Error(data?.message ?? "No fue posible iniciar sesion.");
  }

  return data as HomeData;
}
