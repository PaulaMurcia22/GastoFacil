import { Module } from "@nestjs/common";

import { UsersModule } from "../users/users.module";
import { LoginController } from "./login/login.controller";
import { LoginService } from "./login/login.service";
import { RegisterController } from "./register/register.controller";
import { RegisterService } from "./register/register.service";
import { SessionService } from "./session/session.service";

@Module({
  imports: [UsersModule],
  controllers: [LoginController, RegisterController],
  providers: [LoginService, RegisterService, SessionService],
})
export class AuthModule {}
