import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";

import { PG_POOL } from "../database/database.constants";
import { ExpenseType } from "./expenses.constants";
import { ExpenseCategory } from "./interfaces/expense-category.interface";

interface ExpenseRow {
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

interface CreateExpenseParams {
  userId: string;
  categoryId: string;
  amount: number;
  expenseDate: string;
  expenseType: ExpenseType;
  frequencyMonths: number | null;
  description: string | null;
}

interface UpdateExpenseParams extends CreateExpenseParams {
  id: string;
}

interface FinancialSnapshotRow {
  incomeTotal: string;
  expenseTotal: string;
  goalContributionTotal: string;
}

@Injectable()
export class ExpensesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findExpenseCategories(): Promise<ExpenseCategory[]> {
    const result = await this.pool.query<ExpenseCategory>(
      `
        SELECT
          id,
          name
        FROM categories
        WHERE category_type = 'expense'
          AND is_active = TRUE
        ORDER BY name ASC
      `,
    );

    return result.rows;
  }

  async findExpenseCategoryById(
    categoryId: string,
  ): Promise<ExpenseCategory | null> {
    const result = await this.pool.query<ExpenseCategory>(
      `
        SELECT
          id,
          name
        FROM categories
        WHERE id = $1
          AND category_type = 'expense'
          AND is_active = TRUE
        LIMIT 1
      `,
      [categoryId],
    );

    return result.rows[0] ?? null;
  }

  async listByUser(userId: string): Promise<ExpenseRow[]> {
    const result = await this.pool.query<ExpenseRow>(
      `
        SELECT
          e.id,
          e.amount::text AS amount,
          e.expense_date::text AS "expenseDate",
          e.expense_type AS "expenseType",
          e.frequency_months AS "frequencyMonths",
          e.description,
          e.status,
          COALESCE(e.audit->'creacion'->>'fecha', NULL) AS "createdAt",
          c.id AS "categoryId",
          c.name AS "categoryName"
        FROM expenses e
        INNER JOIN categories c
          ON c.id = e.category_id
        WHERE e.user_id = $1
          AND e.status = 1
        ORDER BY e.expense_date DESC, e.id DESC
      `,
      [userId],
    );

    return result.rows;
  }

  async findByIdForUser(id: string, userId: string): Promise<ExpenseRow | null> {
    const result = await this.pool.query<ExpenseRow>(
      `
        SELECT
          e.id,
          e.amount::text AS amount,
          e.expense_date::text AS "expenseDate",
          e.expense_type AS "expenseType",
          e.frequency_months AS "frequencyMonths",
          e.description,
          e.status,
          COALESCE(e.audit->'creacion'->>'fecha', NULL) AS "createdAt",
          c.id AS "categoryId",
          c.name AS "categoryName"
        FROM expenses e
        INNER JOIN categories c
          ON c.id = e.category_id
        WHERE e.id = $1
          AND e.user_id = $2
          AND e.status = 1
        LIMIT 1
      `,
      [id, userId],
    );

    return result.rows[0] ?? null;
  }

  async create(params: CreateExpenseParams): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      `
        INSERT INTO expenses (
          user_id,
          category_id,
          amount,
          expense_date,
          expense_type,
          frequency_months,
          description
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [
        params.userId,
        params.categoryId,
        params.amount,
        params.expenseDate,
        params.expenseType,
        params.frequencyMonths,
        params.description,
      ],
    );

    return result.rows[0]!.id;
  }

  async update(params: UpdateExpenseParams): Promise<string | null> {
    const result = await this.pool.query<{ id: string }>(
      `
        UPDATE expenses
        SET
          category_id = $1,
          amount = $2,
          expense_date = $3,
          expense_type = $4,
          frequency_months = $5,
          description = $6
        WHERE id = $7
          AND user_id = $8
          AND status = 1
        RETURNING id
      `,
      [
        params.categoryId,
        params.amount,
        params.expenseDate,
        params.expenseType,
        params.frequencyMonths,
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
        UPDATE expenses
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

  async getMonthlyFinancialSnapshot(
    userId: string,
    fromDate: string,
    toDate: string,
    expenseIdToExclude?: string,
  ): Promise<{
    incomeTotal: number;
    expenseTotal: number;
    goalContributionTotal: number;
  }> {
    const result = await this.pool.query<FinancialSnapshotRow>(
      `
        SELECT
          COALESCE((
            SELECT SUM(i.amount)
            FROM incomes i
            WHERE i.user_id = $1
              AND i.status = 1
              AND i.income_date BETWEEN $2::date AND $3::date
          ), 0)::text AS "incomeTotal",
          COALESCE((
            SELECT SUM(e.amount)
            FROM expenses e
            WHERE e.user_id = $1
              AND e.status = 1
              AND e.expense_date BETWEEN $2::date AND $3::date
              AND ($4::uuid IS NULL OR e.id <> $4::uuid)
          ), 0)::text AS "expenseTotal",
          COALESCE((
            SELECT SUM(d.amount)
            FROM goal_deposits d
            WHERE d.user_id = $1
              AND d.contribution_date BETWEEN $2::date AND $3::date
          ), 0)::text AS "goalContributionTotal"
      `,
      [userId, fromDate, toDate, expenseIdToExclude ?? null],
    );

    const row = result.rows[0];

    return {
      incomeTotal: Number(row?.incomeTotal ?? "0"),
      expenseTotal: Number(row?.expenseTotal ?? "0"),
      goalContributionTotal: Number(row?.goalContributionTotal ?? "0"),
    };
  }
}
