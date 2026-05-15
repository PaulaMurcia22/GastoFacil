import {
  Body,
  Delete,
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

import { SessionGuard } from "../auth/session/session.guard";
import { SessionRequest } from "../auth/session/session-request.interface";
import { CreateIncomeDto } from "./dto/create-income.dto";
import { IncomesService } from "./incomes.service";

@Controller("api/v1/incomes")
@UseGuards(SessionGuard)
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Get("categories")
  async listCategories() {
    const items = await this.incomesService.listCategories();

    return {
      items,
    };
  }

  @Get()
  async list(@Req() request: SessionRequest) {
    const items = await this.incomesService.listByUser(request.user.sub);

    return {
      items,
    };
  }

  @Get(":id")
  async findById(@Param("id") id: string, @Req() request: SessionRequest) {
    const item = await this.incomesService.findByIdForUser(id, request.user.sub);

    return {
      item,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateIncomeDto,
    @Req() request: SessionRequest,
  ) {
    const item = await this.incomesService.create(request.user.sub, dto);

    return {
      message: "Ingreso registrado correctamente.",
      item,
    };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: CreateIncomeDto,
    @Req() request: SessionRequest,
  ) {
    const item = await this.incomesService.update(id, request.user.sub, dto);

    return {
      message: "Ingreso actualizado correctamente.",
      item,
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async delete(@Param("id") id: string, @Req() request: SessionRequest) {
    await this.incomesService.delete(id, request.user.sub);

    return {
      message: "Ingreso eliminado correctamente.",
    };
  }
}
