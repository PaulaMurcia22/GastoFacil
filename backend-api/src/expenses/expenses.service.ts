import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { CreateExpenseDto } from "./dto/create-expense.dto";
import {
  EXPENSE_TYPE_LABELS,
  type ExpenseType,
} from "./expenses.constants";
import { ExpenseCategory } from "./interfaces/expense-category.interface";
import { ExpenseResponse } from "./interfaces/expense-response.interface";
import { ExpensesRepository } from "./expenses.repository";

interface ExpenseRowLike {
  id: string;
  amount: string;
  expenseDate: string;
  expenseType: ExpenseType;
  frequencyMonths: number | null;
  description: string | null;
  status: number;
  createdAt: string | null;
  categoryId: string;
  categoryName: string;
}

@Injectable()
export class ExpensesService {
  constructor(private readonly expensesRepository: ExpensesRepository) {}

  listCategories(): Promise<ExpenseCategory[]> {
    return this.expensesRepository.findExpenseCategories();
  }

  async listByUser(userId: string): Promise<ExpenseResponse[]> {
    const expenses = await this.expensesRepository.listByUser(userId);

    return expenses.map((expense) => this.mapExpense(expense));
  }

  async findByIdForUser(id: string, userId: string): Promise<ExpenseResponse> {
    const expense = await this.expensesRepository.findByIdForUser(id, userId);

    if (!expense) {
      throw new NotFoundException("No encontramos el gasto solicitado.");
    }

    return this.mapExpense(expense);
  }

  async create(userId: string, dto: CreateExpenseDto): Promise<ExpenseResponse> {
    const category = await this.expensesRepository.findExpenseCategoryById(
      dto.categoryId,
    );

    if (!category) {
      throw new BadRequestException("La categoria seleccionada no esta disponible.");
    }

    if (dto.expenseType === "variable") {
      if (!dto.frequencyMonths || dto.frequencyMonths < 1) {
        throw new BadRequestException(
          "La frecuencia en meses es obligatoria para gastos variables.",
        );
      }
    }

    if (dto.expenseType !== "variable" && dto.frequencyMonths != null) {
      throw new BadRequestException(
        "La frecuencia solo aplica para gastos variables.",
      );
    }

    const availableMoney = await this.calculateAvailableMoneyForMonth(
      userId,
      dto.expenseDate,
    );

    if (dto.amount > availableMoney) {
      throw new BadRequestException(
        "No es posible registrar ese gasto porque supera tu dinero disponible. Ingresa un valor mas bajo o reduce otros gastos.",
      );
    }

    const createdExpenseId = await this.expensesRepository.create({
      userId,
      categoryId: category.id,
      amount: dto.amount,
      expenseDate: dto.expenseDate,
      expenseType: dto.expenseType,
      frequencyMonths:
        dto.expenseType === "variable" ? dto.frequencyMonths ?? null : null,
      description: dto.description?.trim() || null,
    });

    return this.findByIdForUser(createdExpenseId, userId);
  }

  async update(
    id: string,
    userId: string,
    dto: CreateExpenseDto,
  ): Promise<ExpenseResponse> {
    const category = await this.expensesRepository.findExpenseCategoryById(
      dto.categoryId,
    );

    if (!category) {
      throw new BadRequestException("La categoria seleccionada no esta disponible.");
    }

    if (dto.expenseType === "variable") {
      if (!dto.frequencyMonths || dto.frequencyMonths < 1) {
        throw new BadRequestException(
          "La frecuencia en meses es obligatoria para gastos variables.",
        );
      }
    }

    if (dto.expenseType !== "variable" && dto.frequencyMonths != null) {
      throw new BadRequestException(
        "La frecuencia solo aplica para gastos variables.",
      );
    }

    const availableMoney = await this.calculateAvailableMoneyForMonth(
      userId,
      dto.expenseDate,
      id,
    );

    if (dto.amount > availableMoney) {
      throw new BadRequestException(
        "No es posible registrar ese gasto porque supera tu dinero disponible. Ingresa un valor mas bajo o reduce otros gastos.",
      );
    }

    const updatedExpenseId = await this.expensesRepository.update({
      id,
      userId,
      categoryId: category.id,
      amount: dto.amount,
      expenseDate: dto.expenseDate,
      expenseType: dto.expenseType,
      frequencyMonths:
        dto.expenseType === "variable" ? dto.frequencyMonths ?? null : null,
      description: dto.description?.trim() || null,
    });

    if (!updatedExpenseId) {
      throw new NotFoundException("No encontramos el gasto solicitado.");
    }

    return this.findByIdForUser(updatedExpenseId, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const deletedExpenseId = await this.expensesRepository.softDelete(id, userId);

    if (!deletedExpenseId) {
      throw new NotFoundException("No encontramos el gasto solicitado.");
    }
  }

  private mapExpense(expense: ExpenseRowLike): ExpenseResponse {
    return {
      id: expense.id,
      amount: Number(expense.amount),
      expenseDate: expense.expenseDate,
      expenseType: expense.expenseType,
      expenseTypeLabel: EXPENSE_TYPE_LABELS[expense.expenseType],
      frequencyMonths: expense.frequencyMonths,
      frequencyLabel:
        expense.expenseType === "variable" && expense.frequencyMonths
          ? `${expense.frequencyMonths} meses`
          : null,
      description: expense.description,
      status: expense.status,
      createdAt: expense.createdAt,
      category: {
        id: expense.categoryId,
        name: expense.categoryName,
      },
    };
  }

  private async calculateAvailableMoneyForMonth(
    userId: string,
    referenceDate: string,
    expenseIdToExclude?: string,
  ): Promise<number> {
    const { fromDate, toDate } = this.buildMonthRange(referenceDate);
    const snapshot = await this.expensesRepository.getMonthlyFinancialSnapshot(
      userId,
      fromDate,
      toDate,
      expenseIdToExclude,
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
