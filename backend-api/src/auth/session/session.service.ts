import { Injectable } from "@nestjs/common";

import { getAppConfig } from "../../config/env";
import { UserRecord } from "../../users/interfaces/user-record.interface";
import { signJwt } from "./jwt";
import { IssuedSession } from "./session.types";

@Injectable()
export class SessionService {
  createSession(user: UserRecord): IssuedSession {
    const config = getAppConfig();
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + config.jwtExpiresInHours * 60 * 60;
    const accessToken = signJwt(
      {
        sub: user.id,
        email: user.email,
        nickname: user.nickname,
        status: user.status,
        iat: issuedAt,
        exp: expiresAt,
      },
      config.jwtSecret,
    );

    return {
      message: "Inicio de sesion exitoso.",
      accessToken,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      user: {
        id: user.id,
        fullName: user.full_name,
        nickname: user.nickname,
        email: user.email,
        age: user.age,
        status: user.status,
      },
    };
  }
}
