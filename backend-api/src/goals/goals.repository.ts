import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";

import { PG_POOL } from "../database/database.constants";
import { GoalStatus } from "./goals.constants";
import { GoalCategory } from "./interfaces/goal-category.interface";

interface GoalRow {
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

interface GoalContributionRow {
  id: string;
  amount: string;
  contributionDate: string;
  note: string | null;
  createdAt: string | null;
}

interface CreateGoalParams {
  userId: string;
  categoryId: string;
  name: string;
  targetAmount: number;
  deadline: string | null;
  description: string | null;
}

interface UpdateGoalParams extends CreateGoalParams {
  id: string;
}

interface CreateGoalContributionParams {
  goalId: string;
  userId: string;
  amount: number;
  contributionDate: string;
  note: string | null;
}

interface FinancialSnapshotRow {
  incomeTotal: string;
  expenseTotal: string;
  goalContributionTotal: string;
}

@Injectable()
export class GoalsRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findGoalCategories(): Promise<GoalCategory[]> {
    const result = await this.pool.query<GoalCategory>(
      `
        SELECT
          id,
          name
        FROM categories
        WHERE category_type = 'goal'
          AND is_active = TRUE
        ORDER BY name ASC
      `,
    );

    return result.rows;
  }

  async findGoalCategoryById(categoryId: string): Promise<GoalCategory | null> {
    const result = await this.pool.query<GoalCategory>(
      `
        SELECT
          id,
          name
        FROM categories
        WHERE id = $1
          AND category_type = 'goal'
          AND is_active = TRUE
        LIMIT 1
      `,
      [categoryId],
    );

    return result.rows[0] ?? null;
  }

  async listByUser(userId: string): Promise<GoalRow[]> {
    const result = await this.pool.query<GoalRow>(
      `
        SELECT
          g.id,
          g.name,
          g.description,
          g.target_amount::text AS "targetAmount",
          COALESCE(
            SUM(
              CASE
                WHEN date_trunc('month', d.contribution_date) = date_trunc('month', CURRENT_DATE)
                  THEN d.amount
                ELSE 0
              END
            ),
            0
          )::text AS "contributedThisMonth",
          g.deadline::text AS deadline,
          g.status,
          COALESCE(g.audit->'creacion'->>'fecha', NULL) AS "createdAt",
          c.id AS "categoryId",
          c.name AS "categoryName",
          COALESCE(SUM(d.amount), 0)::text AS "savedAmount"
        FROM goals g
        INNER JOIN categories c
          ON c.id = g.category_id
        LEFT JOIN goal_deposits d
          ON d.goal_id = g.id
         AND d.user_id = g.user_id
        WHERE g.user_id = $1
          AND g.status <> 'cancelled'
        GROUP BY g.id, c.id
        ORDER BY g.deadline ASC NULLS LAST, g.id DESC
      `,
      [userId],
    );

    return result.rows;
  }

  async findByIdForUser(id: string, userId: string): Promise<GoalRow | null> {
    const result = await this.pool.query<GoalRow>(
      `
        SELECT
          g.id,
          g.name,
          g.description,
          g.target_amount::text AS "targetAmount",
          COALESCE(
            SUM(
              CASE
                WHEN date_trunc('month', d.contribution_date) = date_trunc('month', CURRENT_DATE)
                  THEN d.amount
                ELSE 0
              END
            ),
            0
          )::text AS "contributedThisMonth",
          g.deadline::text AS deadline,
          g.status,
          COALESCE(g.audit->'creacion'->>'fecha', NULL) AS "createdAt",
          c.id AS "categoryId",
          c.name AS "categoryName",
          COALESCE(SUM(d.amount), 0)::text AS "savedAmount"
        FROM goals g
        INNER JOIN categories c
          ON c.id = g.category_id
        LEFT JOIN goal_deposits d
          ON d.goal_id = g.id
         AND d.user_id = g.user_id
        WHERE g.id = $1
          AND g.user_id = $2
          AND g.status <> 'cancelled'
        GROUP BY g.id, c.id
        LIMIT 1
      `,
      [id, userId],
    );

    return result.rows[0] ?? null;
  }

  async findContributionsByGoal(goalId: string): Promise<GoalContributionRow[]> {
    const result = await this.pool.query<GoalContributionRow>(
      `
        SELECT
          id,
          amount::text AS amount,
          contribution_date::text AS "contributionDate",
          note,
          COALESCE(audit->'creacion'->>'fecha', NULL) AS "createdAt"
        FROM goal_deposits
        WHERE goal_id = $1
        ORDER BY contribution_date DESC, id DESC
      `,
      [goalId],
    );

    return result.rows;
  }

  async findContributionById(
    goalId: string,
    contributionId: string,
    userId: string,
  ): Promise<GoalContributionRow | null> {
    const result = await this.pool.query<GoalContributionRow>(
      `
        SELECT
          d.id,
          d.amount::text AS amount,
          d.contribution_date::text AS "contributionDate",
          d.note,
          COALESCE(d.audit->'creacion'->>'fecha', NULL) AS "createdAt"
        FROM goal_deposits d
        INNER JOIN goals g
          ON g.id = d.goal_id
        WHERE d.id = $1
          AND d.goal_id = $2
          AND d.user_id = $3
          AND g.user_id = $3
          AND g.status <> 'cancelled'
        LIMIT 1
      `,
      [contributionId, goalId, userId],
    );

    return result.rows[0] ?? null;
  }

  async create(params: CreateGoalParams): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      `
        INSERT INTO goals (
          user_id,
          category_id,
          name,
          description,
          target_amount,
          deadline
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [
        params.userId,
        params.categoryId,
        params.name,
        params.description,
        params.targetAmount,
        params.deadline,
      ],
    );

    return result.rows[0]!.id;
  }

  async addContribution(params: CreateGoalContributionParams): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      `
        INSERT INTO goal_deposits (
          goal_id,
          user_id,
          amount,
          contribution_date,
          note
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [
        params.goalId,
        params.userId,
        params.amount,
        params.contributionDate,
        params.note,
      ],
    );

    return result.rows[0]!.id;
  }

  async updateContributionAmount(
    contributionId: string,
    goalId: string,
    userId: string,
    amount: number,
  ): Promise<string | null> {
    const result = await this.pool.query<{ id: string }>(
      `
        UPDATE goal_deposits d
        SET amount = $1
        FROM goals g
        WHERE d.id = $2
          AND d.goal_id = $3
          AND d.user_id = $4
          AND g.id = d.goal_id
          AND g.user_id = $4
          AND g.status <> 'cancelled'
        RETURNING d.id
      `,
      [amount, contributionId, goalId, userId],
    );

    return result.rows[0]?.id ?? null;
  }

  async update(params: UpdateGoalParams): Promise<string | null> {
    const result = await this.pool.query<{ id: string }>(
      `
        UPDATE goals
        SET
          category_id = $1,
          name = $2,
          description = $3,
          target_amount = $4,
          deadline = $5
        WHERE id = $6
          AND user_id = $7
          AND status <> 'cancelled'
        RETURNING id
      `,
      [
        params.categoryId,
        params.name,
        params.description,
        params.targetAmount,
        params.deadline,
        params.id,
        params.userId,
      ],
    );

    return result.rows[0]?.id ?? null;
  }

  async softDelete(id: string, userId: string): Promise<string | null> {
    const result = await this.pool.query<{ id: string }>(
      `
        UPDATE goals
        SET status = 'cancelled'
        WHERE id = $1
          AND user_id = $2
          AND status <> 'cancelled'
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
          ), 0)::text AS "expenseTotal",
          COALESCE((
            SELECT SUM(d.amount)
            FROM goal_deposits d
            WHERE d.user_id = $1
              AND d.contribution_date BETWEEN $2::date AND $3::date
          ), 0)::text AS "goalContributionTotal"
      `,
      [userId, fromDate, toDate],
    );

    const row = result.rows[0];

    return {
      incomeTotal: Number(row?.incomeTotal ?? "0"),
      expenseTotal: Number(row?.expenseTotal ?? "0"),
      goalContributionTotal: Number(row?.goalContributionTotal ?? "0"),
    };
  }
}
