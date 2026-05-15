import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { CreateIncomeDto } from "./dto/create-income.dto";
import {
  INCOME_PERIODICITY_LABELS,
  type IncomePeriodicity,
} from "./incomes.constants";
import { IncomeCategory } from "./interfaces/income-category.interface";
import { IncomeResponse } from "./interfaces/income-response.interface";
import { IncomesRepository } from "./incomes.repository";

interface IncomeRowLike {
  id: string;
  amount: string;
  incomeDate: string;
  periodicity: IncomePeriodicity;
  description: string | null;
  status: number;
  createdAt: string | null;
  categoryId: string;
  categoryName: string;
}

@Injectable()
export class IncomesService {
  constructor(private readonly incomesRepository: IncomesRepository) {}

  listCategories(): Promise<IncomeCategory[]> {
    return this.incomesRepository.findIncomeCategories();
  }

  async listByUser(userId: string): Promise<IncomeResponse[]> {
    const incomes = await this.incomesRepository.listByUser(userId);

    return incomes.map((income) => this.mapIncome(income));
  }

  async findByIdForUser(id: string, userId: string): Promise<IncomeResponse> {
    const income = await this.incomesRepository.findByIdForUser(id, userId);

    if (!income) {
      throw new NotFoundException("No encontramos el ingreso solicitado.");
    }

    return this.mapIncome(income);
  }

  async create(userId: string, dto: CreateIncomeDto): Promise<IncomeResponse> {
    const category = await this.incomesRepository.findIncomeCategoryById(
      dto.categoryId,
    );

    if (!category) {
      throw new BadRequestException("La categoria seleccionada no esta disponible.");
    }

    const createdIncomeId = await this.incomesRepository.create({
      userId,
      categoryId: category.id,
      amount: dto.amount,
      incomeDate: dto.incomeDate,
      periodicity: dto.periodicity,
      description: dto.description?.trim() || null,
    });

    return this.findByIdForUser(createdIncomeId, userId);
  }

  async update(
    id: string,
    userId: string,
    dto: CreateIncomeDto,
  ): Promise<IncomeResponse> {
    const category = await this.incomesRepository.findIncomeCategoryById(
      dto.categoryId,
    );

    if (!category) {
      throw new BadRequestException("La categoria seleccionada no esta disponible.");
    }

    const updatedIncomeId = await this.incomesRepository.update({
      id,
      userId,
      categoryId: category.id,
      amount: dto.amount,
      incomeDate: dto.incomeDate,
      periodicity: dto.periodicity,
      description: dto.description?.trim() || null,
    });

    if (!updatedIncomeId) {
      throw new NotFoundException("No encontramos el ingreso solicitado.");
    }

    return this.findByIdForUser(updatedIncomeId, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const deletedIncomeId = await this.incomesRepository.softDelete(id, userId);

    if (!deletedIncomeId) {
      throw new NotFoundException("No encontramos el ingreso solicitado.");
    }
  }

  private mapIncome(income: IncomeRowLike): IncomeResponse {
    return {
      id: income.id,
      amount: Number(income.amount),
      incomeDate: income.incomeDate,
      periodicity: income.periodicity,
      periodicityLabel: INCOME_PERIODICITY_LABELS[income.periodicity],
      description: income.description,
      status: income.status,
      createdAt: income.createdAt,
      category: {
        id: income.categoryId,
        name: income.categoryName,
      },
    };
  }
}
