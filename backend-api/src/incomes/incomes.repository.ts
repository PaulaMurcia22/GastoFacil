import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";

import { PG_POOL } from "../database/database.constants";
import { IncomePeriodicity } from "./incomes.constants";
import { IncomeCategory } from "./interfaces/income-category.interface";

interface IncomeRow {
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

interface CreateIncomeParams {
  userId: string;
  categoryId: string;
  amount: number;
  incomeDate: string;
  periodicity: IncomePeriodicity;
  description: string | null;
}

interface UpdateIncomeParams extends CreateIncomeParams {
  id: string;
}

@Injectable()
export class IncomesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findIncomeCategories(): Promise<IncomeCategory[]> {
    const result = await this.pool.query<IncomeCategory>(
      `
        SELECT
          id,
          name
        FROM categories
        WHERE category_type = 'income'
          AND is_active = TRUE
        ORDER BY name ASC
      `,
    );

    return result.rows;
  }

  async findIncomeCategoryById(categoryId: string): Promise<IncomeCategory | null> {
    const result = await this.pool.query<IncomeCategory>(
      `
        SELECT
          id,
          name
        FROM categories
        WHERE id = $1
          AND category_type = 'income'
          AND is_active = TRUE
        LIMIT 1
      `,
      [categoryId],
    );

    return result.rows[0] ?? null;
  }

  async listByUser(userId: string): Promise<IncomeRow[]> {
    const result = await this.pool.query<IncomeRow>(
      `
        SELECT
          i.id,
          i.amount::text AS amount,
          i.income_date::text AS "incomeDate",
          i.periodicity,
          i.description,
          i.status,
          COALESCE(i.audit->'creacion'->>'fecha', NULL) AS "createdAt",
          c.id AS "categoryId",
          c.name AS "categoryName"
        FROM incomes i
        INNER JOIN categories c
          ON c.id = i.category_id
        WHERE i.user_id = $1
          AND i.status = 1
        ORDER BY i.income_date DESC, i.id DESC
      `,
      [userId],
    );

    return result.rows;
  }

  async findByIdForUser(id: string, userId: string): Promise<IncomeRow | null> {
    const result = await this.pool.query<IncomeRow>(
      `
        SELECT
          i.id,
          i.amount::text AS amount,
          i.income_date::text AS "incomeDate",
          i.periodicity,
          i.description,
          i.status,
          COALESCE(i.audit->'creacion'->>'fecha', NULL) AS "createdAt",
          c.id AS "categoryId",
          c.name AS "categoryName"
        FROM incomes i
        INNER JOIN categories c
          ON c.id = i.category_id
        WHERE i.id = $1
          AND i.user_id = $2
          AND i.status = 1
        LIMIT 1
      `,
      [id, userId],
    );

    return result.rows[0] ?? null;
  }

  async create(params: CreateIncomeParams): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      `
        INSERT INTO incomes (
          user_id,
          category_id,
          amount,
          income_date,
          periodicity,
          description
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [
        params.userId,
        params.categoryId,
        params.amount,
        params.incomeDate,
        params.periodicity,
        params.description,
      ],
    );

    return result.rows[0]!.id;
  }

  async update(params: UpdateIncomeParams): Promise<string | null> {
    const result = await this.pool.query<{ id: string }>(
      `
        UPDATE incomes
        SET
          category_id = $1,
          amount = $2,
          income_date = $3,
          periodicity = $4,
          description = $5
        WHERE id = $6
          AND user_id = $7
          AND status = 1
        RETURNING id
      `,
      [
        params.categoryId,
        params.amount,
        params.incomeDate,
        params.periodicity,
        params.description,
        params.id,
        params.userId,
      ],
    );

    return result.rows[0]?.id ?? null;
  }

  async softDelete(id: string, userId: string): Promise<string | null> {
    const result = await this.pool.query<{ id: string }>(
      `
        UPDATE incomes
        SET status = 0
        WHERE id = $1
          AND user_id = $2
          AND status = 1
        RETURNING id
      `,
      [id, userId],
    );

    return result.rows[0]?.id ?? null;
  }
}
