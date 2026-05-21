import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { CreateGoalContributionDto } from "./dto/create-goal-contribution.dto";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { UpdateGoalContributionDto } from "./dto/update-goal-contribution.dto";
import { GOAL_STATUS_LABELS, type GoalStatus } from "./goals.constants";
import { GoalCategory } from "./interfaces/goal-category.interface";
import {
  GoalContributionResponse,
  GoalDetailResponse,
  GoalResponse,
} from "./interfaces/goal-response.interface";
import { GoalsRepository } from "./goals.repository";

interface GoalRowLike {
  id: string;
  name: string;
  description: string | null;
  targetAmount: string;
  contributedThisMonth: string;
  deadline: string | null;
  status: GoalStatus;
  createdAt: string | null;
  categoryId: string;
  categoryName: string;
  savedAmount: string;
}

interface GoalContributionRowLike {
  id: string;
  amount: string;
  contributionDate: string;
  note: string | null;
  createdAt: string | null;
}

@Injectable()
export class GoalsService {
  constructor(private readonly goalsRepository: GoalsRepository) {}

  listCategories(): Promise<GoalCategory[]> {
    return this.goalsRepository.findGoalCategories();
  }

  async listByUser(userId: string): Promise<GoalResponse[]> {
    const goals = await this.goalsRepository.listByUser(userId);

    return goals.map((goal) => this.mapGoal(goal));
  }

  async findByIdForUser(id: string, userId: string): Promise<GoalDetailResponse> {
    const goal = await this.goalsRepository.findByIdForUser(id, userId);

    if (!goal) {
      throw new NotFoundException("No encontramos la meta solicitada.");
    }

    const contributions = await this.goalsRepository.findContributionsByGoal(goal.id);

    return {
      ...this.mapGoal(goal),
      contributions: contributions.map((contribution) =>
        this.mapContribution(contribution),
      ),
    };
  }

  async create(userId: string, dto: CreateGoalDto): Promise<GoalDetailResponse> {
    const category = await this.goalsRepository.findGoalCategoryById(dto.categoryId);

    if (!category) {
      throw new BadRequestException("La categoria seleccionada no esta disponible.");
    }

    const createdGoalId = await this.goalsRepository.create({
      userId,
      categoryId: category.id,
      name: dto.name.trim(),
      targetAmount: dto.targetAmount,
      deadline: dto.deadline ?? null,
      description: dto.description?.trim() || null,
    });

    return this.findByIdForUser(createdGoalId, userId);
  }

  async update(
    id: string,
    userId: string,
    dto: CreateGoalDto,
  ): Promise<GoalDetailResponse> {
    const category = await this.goalsRepository.findGoalCategoryById(dto.categoryId);

    if (!category) {
      throw new BadRequestException("La categoria seleccionada no esta disponible.");
    }

    const updatedGoalId = await this.goalsRepository.update({
      id,
      userId,
      categoryId: category.id,
      name: dto.name.trim(),
      targetAmount: dto.targetAmount,
      deadline: dto.deadline ?? null,
      description: dto.description?.trim() || null,
    });

    if (!updatedGoalId) {
      throw new NotFoundException("No encontramos la meta solicitada.");
    }

    return this.findByIdForUser(updatedGoalId, userId);
  }

  async addContribution(
    goalId: string,
    userId: string,
    dto: CreateGoalContributionDto,
  ): Promise<GoalDetailResponse> {
    const goal = await this.goalsRepository.findByIdForUser(goalId, userId);

    if (!goal) {
      throw new NotFoundException("No encontramos la meta solicitada.");
    }

    const summary = this.mapGoal(goal);

    if (summary.status === "completed") {
      throw new BadRequestException(
        "Esta meta ya esta completada. No puedes agregar mas aportes.",
      );
    }

    const contributionDate = dto.contributionDate ?? this.buildTodayValue();
    const availableMoney = await this.calculateAvailableMoneyForMonth(
      userId,
      contributionDate,
    );

    if (dto.amount > availableMoney) {
      throw new BadRequestException(
        "No es posible registrar ese ahorro porque supera tu dinero disponible.",
      );
    }

    await this.goalsRepository.addContribution({
      goalId,
      userId,
      amount: dto.amount,
      contributionDate,
      note: dto.note?.trim() || null,
    });

    return this.findByIdForUser(goalId, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const deletedGoalId = await this.goalsRepository.softDelete(id, userId);

    if (!deletedGoalId) {
      throw new NotFoundException("No encontramos la meta solicitada.");
    }
  }

  async updateContribution(
    goalId: string,
    contributionId: string,
    userId: string,
    dto: UpdateGoalContributionDto,
  ): Promise<GoalDetailResponse> {
    const contribution = await this.goalsRepository.findContributionById(
      goalId,
      contributionId,
      userId,
    );

    if (!contribution) {
      throw new NotFoundException("No encontramos el aporte solicitado.");
    }

    const currentAmount = Number(contribution.amount);

    if (dto.amount > currentAmount) {
      throw new BadRequestException(
        "Solo puedes reducir el valor ahorrado de un aporte existente.",
      );
    }

    const updatedId = await this.goalsRepository.updateContributionAmount(
      contributionId,
      goalId,
      userId,
      dto.amount,
    );

    if (!updatedId) {
      throw new NotFoundException("No encontramos el aporte solicitado.");
    }

    return this.findByIdForUser(goalId, userId);
  }

  private mapGoal(goal: GoalRowLike): GoalResponse {
    const targetAmount = Number(goal.targetAmount);
    const savedAmount = Number(goal.savedAmount);
    const remainingAmount = Math.max(targetAmount - savedAmount, 0);
    const progressPercentage =
      targetAmount > 0 ? Math.min((savedAmount / targetAmount) * 100, 100) : 0;
    const isCompleted = savedAmount >= targetAmount;
    const status: GoalStatus = isCompleted ? "completed" : goal.status;

    return {
      id: goal.id,
      name: goal.name,
      description: goal.description,
      targetAmount,
      contributedThisMonth: Number(goal.contributedThisMonth),
      savedAmount,
      remainingAmount,
      progressPercentage: Number(progressPercentage.toFixed(1)),
      monthlyRequiredAmount: this.calculateMonthlyRequiredAmount(
        remainingAmount,
        goal.deadline,
      ),
      deadline: goal.deadline,
      status,
      statusLabel: GOAL_STATUS_LABELS[status],
      createdAt: goal.createdAt,
      category: {
        id: goal.categoryId,
        name: goal.categoryName,
      },
    };
  }

  private mapContribution(
    contribution: GoalContributionRowLike,
  ): GoalContributionResponse {
    return {
      id: contribution.id,
      amount: Number(contribution.amount),
      contributionDate: contribution.contributionDate,
      note: contribution.note,
      createdAt: contribution.createdAt,
    };
  }

  private calculateMonthlyRequiredAmount(
    remainingAmount: number,
    deadline: string | null,
  ): number | null {
    if (!deadline || remainingAmount <= 0) {
      return null;
    }

    const deadlineDate = new Date(`${deadline}T00:00:00`);

    if (Number.isNaN(deadlineDate.getTime())) {
      return null;
    }

    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
      0,
    );
    const diffMs = deadlineDate.getTime() - todayStart.getTime();

    if (diffMs < 0) {
      return remainingAmount;
    }

    const oneDayMs = 1000 * 60 * 60 * 24;
    const daysRemaining = Math.floor(diffMs / oneDayMs) + 1;
    const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));

    return Number((remainingAmount / monthsRemaining).toFixed(2));
  }

  private buildTodayValue(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private async calculateAvailableMoneyForMonth(
    userId: string,
    referenceDate: string,
  ): Promise<number> {
    const { fromDate, toDate } = this.buildMonthRange(referenceDate);
    const snapshot = await this.goalsRepository.getMonthlyFinancialSnapshot(
      userId,
      fromDate,
      toDate,
    );

    return snapshot.incomeTotal - snapshot.expenseTotal - snapshot.goalContributionTotal;
  }

  private buildMonthRange(referenceDate: string): { fromDate: string; toDate: string } {
    const date = new Date(`${referenceDate}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      const today = new Date();
      const fallbackMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      return this.buildMonthRangeFromDate(fallbackMonth);
    }

    return this.buildMonthRangeFromDate(date);
  }

  private buildMonthRangeFromDate(date: Date): { fromDate: string; toDate: string } {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    return {
      fromDate: this.formatDate(start),
      toDate: this.formatDate(end),
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
}
