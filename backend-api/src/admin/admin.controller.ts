import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";

import { AdminGuard } from "../auth/session/admin.guard";
import { SessionGuard } from "../auth/session/session.guard";
import { SessionRequest } from "../auth/session/session-request.interface";
import { CreateAdminUserDto } from "./dto/create-admin-user.dto";
import { AdminService } from "./admin.service";

@Controller("api/v1/admin")
@UseGuards(SessionGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard")
  async getDashboard(@Req() _request: SessionRequest) {
    return this.adminService.getDashboard();
  }

  @Post("users")
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() dto: CreateAdminUserDto) {
    const users = await this.adminService.createUser(dto);

    return {
      message: "Usuario creado correctamente.",
      users,
    };
  }

  @Patch("users/:id/deactivate")
  async deactivateUser(
    @Param("id") id: string,
    @Req() request: SessionRequest,
  ) {
    const users = await this.adminService.deactivateUser(id, request.user.sub);

    return {
      message: "Usuario desactivado correctamente.",
      users,
    };
  }

  @Patch("users/:id/promote")
  async promoteUserToAdmin(@Param("id") id: string) {
    const users = await this.adminService.promoteUserToAdmin(id);

    return {
      message: "Usuario convertido en administrador correctamente.",
      users,
    };
  }
}
