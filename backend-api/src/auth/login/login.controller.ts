import { Body, Controller, HttpCode, HttpStatus, Post, Res,} from "@nestjs/common";
import { Response } from "express";
import { getAppConfig } from "../../config/env";
import { AUTH_COOKIE_NAME } from "../session/session.constants";
import { LoginService } from "./login.service";
import { LoginDto } from "./dto/login.dto";

@Controller("api/v1/auth")
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const config = getAppConfig();
    const session = await this.loginService.login(dto);

    response.cookie(AUTH_COOKIE_NAME, session.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: config.jwtExpiresInHours * 60 * 60 * 1000,
      path: "/",
    });

    return {
      message: session.message,
      expiresAt: session.expiresAt,
      user: session.user,
    };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return {
      message: "Sesion cerrada.",
    };
  }
}
