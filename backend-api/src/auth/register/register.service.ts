import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";

import { UsersRepository } from "../../users/users.repository";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class RegisterService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException("Ya existe una cuenta registrada con ese correo.");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.usersRepository.create({
        fullName: dto.fullName,
        nickname: dto.nickname,
        email: dto.email,
        age: dto.age,
        passwordHash,
      });

      return {
        message: "Usuario creado exitosamente.",
        user: {
          id: user.id,
          fullName: user.full_name,
          nickname: user.nickname,
          email: user.email,
          age: user.age,
          status: user.status,
          id_rol: user.id_rol,
          audit: user.audit,
        },
      };
    } catch (error) {
      const pgError = error as { code?: string };

      if (pgError.code === "23505") {
        throw new ConflictException("El correo ya existe en la plataforma.");
      }

      throw new InternalServerErrorException(
        "No fue posible registrar el usuario.",
      );
    }
  }
}
