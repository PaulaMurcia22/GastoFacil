import "dotenv/config";

export interface AppConfig {
  port: number;
  corsOrigin: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresInHours: number;
}

function parsePort(value: string | undefined): number {
  const parsed = Number(value ?? "3000");

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("PORT debe ser un numero entero positivo.");
  }

  return parsed;
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  fieldName: string,
): number {
  const parsed = Number(value ?? String(fallback));

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} debe ser un numero entero positivo.`);
  }

  return parsed;
}

export function getAppConfig(): AppConfig {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Falta la variable DATABASE_URL.");
  }

  return {
    port: parsePort(process.env.PORT),
    corsOrigin: process.env.CORS_ORIGIN ?? "*",
    databaseUrl,
    jwtSecret: process.env.JWT_SECRET ?? "gasto-facil-dev-secret",
    jwtExpiresInHours: parsePositiveInteger(
      process.env.JWT_EXPIRES_IN_HOURS,
      8,
      "JWT_EXPIRES_IN_HOURS",
    ),
  };
}
