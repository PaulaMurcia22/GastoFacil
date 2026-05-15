import { createHmac, timingSafeEqual } from "node:crypto";

export interface JwtPayload {
  sub: string;
  email: string;
  nickname: string;
  status: number;
  id_rol?: number;
  iat: number;
  exp: number;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = `${normalized}${"=".repeat(paddingLength)}`;

  return Buffer.from(padded, "base64").toString("utf8");
}

export function signJwt(payload: JwtPayload, secret: string): string {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", secret)
    .update(signatureInput)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${signatureInput}.${signature}`;
}

export function verifyJwt(token: string, secret: string): JwtPayload {
  const [encodedHeader, encodedPayload, signature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error("Token invalido.");
  }

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(signatureInput)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const receivedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    throw new Error("Firma invalida.");
  }

  const header = JSON.parse(decodeBase64Url(encodedHeader)) as {
    alg?: string;
    typ?: string;
  };

  if (header.alg !== "HS256" || header.typ !== "JWT") {
    throw new Error("Encabezado JWT no soportado.");
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload)) as JwtPayload;

  if (!payload.sub || !payload.email || !payload.iat || !payload.exp) {
    throw new Error("Payload JWT incompleto.");
  }

  const currentUnixTime = Math.floor(Date.now() / 1000);

  if (payload.exp <= currentUnixTime) {
    throw new Error("Token expirado.");
  }

  return payload;
}
