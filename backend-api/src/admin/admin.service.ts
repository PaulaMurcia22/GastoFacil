import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";

import { UsersRepository } from "../users/users.repository";
import { CreateAdminUserDto } from "./dto/create-admin-user.dto";
import {
  AdminDashboardResponse,
  AdminDashboardUser,
} from "./interfaces/admin-dashboard.interface";
import {
  AdminDashboardUserRow,
  AdminRepository,
} from "./admin.repository";

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async getDashboard(): Promise<AdminDashboardResponse> {
    const [stats, users] = await Promise.all([
      this.adminRepository.getDashboardStats(),
      this.adminRepository.listUsers(),
    ]);

    return {
      stats: {
        goalCompletionPercentage: Number(stats.goalCompletionPercentage),
        activeUserPercentage: Number(stats.activeUserPercentage),
        goalAdoptionPercentage: Number(stats.goalAdoptionPercentage),
        savingsParticipationPercentage: Number(
          stats.savingsParticipationPercentage,
        ),
      },
      users: users.map((user) => this.mapUser(user)),
    };
  }

  async createUser(dto: CreateAdminUserDto): Promise<AdminDashboardUser[]> {
    const existingUser = await this.usersRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException("Ya existe una cuenta registrada con ese correo.");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.usersRepository.create({
      fullName: dto.fullName,
      nickname: dto.nickname,
      email: dto.email,
      age: dto.age,
      passwordHash,
      roleId: dto.roleId,
    });

    const users = await this.adminRepository.listUsers();

    return users.map((user) => this.mapUser(user));
  }

  async deactivateUser(
    userId: string,
    currentAdminId: string,
  ): Promise<AdminDashboardUser[]> {
    const updatedUserId = await this.adminRepository.deactivateUser(
      userId,
      currentAdminId,
    );

    if (!updatedUserId) {
      throw new NotFoundException(
        "No encontramos un usuario activo para desactivar.",
      );
    }

    const users = await this.adminRepository.listUsers();

    return users.map((user) => this.mapUser(user));
  }

  async promoteUserToAdmin(userId: string): Promise<AdminDashboardUser[]> {
    const updatedUserId = await this.adminRepository.promoteUserToAdmin(userId);

    if (!updatedUserId) {
      throw new NotFoundException("No encontramos un usuario activo para promover.");
    }

    const users = await this.adminRepository.listUsers();

    return users.map((user) => this.mapUser(user));
  }

  private mapUser(user: AdminDashboardUserRow): AdminDashboardUser {
    return {
      id: user.id,
      fullName: user.fullName,
      nickname: user.nickname,
      email: user.email,
      age: user.age,
      status: user.status,
      roleId: user.roleId,
      roleLabel: user.roleLabel === "admin" ? "Administrador" : "General",
      goalsTotal: Number(user.goalsTotal),
      goalsCompleted: Number(user.goalsCompleted),
      savingsParticipationPercentage: Number(user.savingsParticipationPercentage),
    };
  }
}
