import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

import { UsersRepository } from "../../users/users.repository";
import { SessionService } from "../session/session.service";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class LoginService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly sessionService: SessionService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByEmail(dto.email);

    if (!user || user.status !== 1) {
      throw new UnauthorizedException("Usuario o contrasena incorrectos.");
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException("Usuario o contrasena incorrectos.");
    }

    return this.sessionService.createSession(user);
  }
}
