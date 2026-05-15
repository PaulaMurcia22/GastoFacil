import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { getAppConfig } from "../../config/env";
import { AUTH_COOKIE_NAME } from "./session.constants";
import { verifyJwt } from "./jwt";
import { SessionRequest } from "./session-request.interface";

function getCookieValue(
  rawCookieHeader: string | undefined,
  cookieName: string,
): string | null {
  if (!rawCookieHeader) {
    return null;
  }

  const cookies = rawCookieHeader.split(";");

  for (const cookie of cookies) {
    const trimmedCookie = cookie.trim();

    if (!trimmedCookie.startsWith(`${cookieName}=`)) {
      continue;
    }

    return decodeURIComponent(trimmedCookie.slice(cookieName.length + 1));
  }

  return null;
}

@Injectable()
export class SessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    const token = getCookieValue(request.headers.cookie, AUTH_COOKIE_NAME);

    if (!token) {
      throw new UnauthorizedException("No hay una sesion activa.");
    }

    try {
      const config = getAppConfig();
      const user = verifyJwt(token, config.jwtSecret);

      if (user.status !== 1) {
        throw new UnauthorizedException("La cuenta no se encuentra activa.");
      }

      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException("La sesion no es valida.");
    }
  }
}
