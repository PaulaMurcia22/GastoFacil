import {
  Body,
  Controller,
  Delete,
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
import { CreateGoalContributionDto } from "./dto/create-goal-contribution.dto";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { UpdateGoalContributionDto } from "./dto/update-goal-contribution.dto";
import { GoalsService } from "./goals.service";

@Controller("api/v1/goals")
@UseGuards(SessionGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get("categories")
  async listCategories() {
    const items = await this.goalsService.listCategories();

    return {
      items,
    };
  }

  @Get()
  async list(@Req() request: SessionRequest) {
    const items = await this.goalsService.listByUser(request.user.sub);

    return {
      items,
    };
  }

  @Get(":id")
  async findById(@Param("id") id: string, @Req() request: SessionRequest) {
    const item = await this.goalsService.findByIdForUser(id, request.user.sub);

    return {
      item,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateGoalDto, @Req() request: SessionRequest) {
    const item = await this.goalsService.create(request.user.sub, dto);

    return {
      message: "Meta registrada correctamente.",
      item,
    };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: CreateGoalDto,
    @Req() request: SessionRequest,
  ) {
    const item = await this.goalsService.update(id, request.user.sub, dto);

    return {
      message: "Meta actualizada correctamente.",
      item,
    };
  }

  @Post(":id/contributions")
  @HttpCode(HttpStatus.CREATED)
  async addContribution(
    @Param("id") id: string,
    @Body() dto: CreateGoalContributionDto,
    @Req() request: SessionRequest,
  ) {
    const item = await this.goalsService.addContribution(id, request.user.sub, dto);

    return {
      message: "Aporte registrado correctamente.",
      item,
    };
  }

  @Patch(":id/contributions/:contributionId")
  async updateContribution(
    @Param("id") id: string,
    @Param("contributionId") contributionId: string,
    @Body() dto: UpdateGoalContributionDto,
    @Req() request: SessionRequest,
  ) {
    const item = await this.goalsService.updateContribution(
      id,
      contributionId,
      request.user.sub,
      dto,
    );

    return {
      message: "Aporte actualizado correctamente.",
      item,
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async delete(@Param("id") id: string, @Req() request: SessionRequest) {
    await this.goalsService.delete(id, request.user.sub);

    return {
      message: "Meta eliminada correctamente.",
    };
  }
}
