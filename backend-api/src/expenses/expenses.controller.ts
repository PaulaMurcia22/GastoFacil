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
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { ExpensesService } from "./expenses.service";

@Controller("api/v1/expenses")
@UseGuards(SessionGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get("categories")
  async listCategories() {
    const items = await this.expensesService.listCategories();

    return {
      items,
    };
  }

  @Get()
  async list(@Req() request: SessionRequest) {
    const items = await this.expensesService.listByUser(request.user.sub);

    return {
      items,
    };
  }

  @Get(":id")
  async findById(@Param("id") id: string, @Req() request: SessionRequest) {
    const item = await this.expensesService.findByIdForUser(id, request.user.sub);

    return {
      item,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateExpenseDto,
    @Req() request: SessionRequest,
  ) {
    const item = await this.expensesService.create(request.user.sub, dto);

    return {
      message: "Gasto registrado correctamente.",
      item,
    };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: CreateExpenseDto,
    @Req() request: SessionRequest,
  ) {
    const item = await this.expensesService.update(id, request.user.sub, dto);

    return {
      message: "Gasto actualizado correctamente.",
      item,
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async delete(@Param("id") id: string, @Req() request: SessionRequest) {
    await this.expensesService.delete(id, request.user.sub);

    return {
      message: "Gasto eliminado correctamente.",
    };
  }
}