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
}