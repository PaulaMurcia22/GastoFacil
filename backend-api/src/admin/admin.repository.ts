import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";

import { PG_POOL } from "../database/database.constants";

export interface AdminDashboardStatsRow {
  goalCompletionPercentage: string;
  activeUserPercentage: string;
  goalAdoptionPercentage: string;
  savingsParticipationPercentage: string;
  historicalUsersTotal: string;
  monthlyGoalContributionUserPercentage: string;
  monthlyIncomeExpenseUserPercentage: string;
}

export interface AdminDashboardUserRow {
  id: string;
  fullName: string;
  nickname: string;
  email: string;
  age: number;
  status: number;
  roleId: number;
  roleLabel: string;
  goalsTotal: string;
  goalsCompleted: string;
  savingsParticipationPercentage: string;
}

@Injectable()
export class AdminRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getDashboardStats(): Promise<AdminDashboardStatsRow> {
    const result = await this.pool.query<AdminDashboardStatsRow>(
      `
        WITH month_range AS (
          SELECT
            date_trunc('month', CURRENT_DATE)::date AS from_date,
            (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date AS to_date
        ),
        regular_users AS (
          SELECT id, status
          FROM users
          WHERE id_rol = 1
        ),
        active_regular_users AS (
          SELECT id
          FROM regular_users
          WHERE status = 1
        ),
        goal_totals AS (
          SELECT
            g.id,
            g.user_id,
            g.target_amount,
            COALESCE(SUM(d.amount), 0) AS saved_amount
          FROM goals g
          INNER JOIN active_regular_users u
            ON u.id = g.user_id
          LEFT JOIN goal_deposits d
            ON d.goal_id = g.id
           AND d.user_id = g.user_id
          WHERE g.status <> 'cancelled'
          GROUP BY g.id
        ),
        user_activity AS (
          SELECT
            u.id,
            u.status,
            COUNT(gt.id) AS goals_total,
            COALESCE(SUM(gt.saved_amount), 0) AS savings_total
          FROM regular_users u
          LEFT JOIN goal_totals gt
            ON gt.user_id = u.id
          GROUP BY u.id, u.status
        ),
        monthly_goal_users AS (
          SELECT DISTINCT d.user_id
          FROM goal_deposits d
          INNER JOIN active_regular_users u
            ON u.id = d.user_id
          CROSS JOIN month_range mr
          WHERE d.contribution_date BETWEEN mr.from_date AND mr.to_date
        ),
        monthly_income_users AS (
          SELECT DISTINCT i.user_id
          FROM incomes i
          INNER JOIN active_regular_users u
            ON u.id = i.user_id
          CROSS JOIN month_range mr
          WHERE i.status = 1
            AND i.income_date BETWEEN mr.from_date AND mr.to_date
        ),
        monthly_expense_users AS (
          SELECT DISTINCT e.user_id
          FROM expenses e
          INNER JOIN active_regular_users u
            ON u.id = e.user_id
          CROSS JOIN month_range mr
          WHERE e.status = 1
            AND e.expense_date BETWEEN mr.from_date AND mr.to_date
        )
        SELECT
          COALESCE((
            SELECT
              CASE
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND(
                  COUNT(*) FILTER (WHERE saved_amount >= target_amount)::numeric
                  / COUNT(*)::numeric
                  * 100
                )
              END
            FROM goal_totals
          ), 0)::text AS "goalCompletionPercentage"
          ,
          COALESCE((
            SELECT
              CASE
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND(COUNT(*) FILTER (WHERE status = 1)::numeric / COUNT(*)::numeric * 100)
              END
            FROM user_activity
          ), 0)::text AS "activeUserPercentage",
          COALESCE((
            SELECT
              CASE
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND(COUNT(*) FILTER (WHERE goals_total > 0)::numeric / COUNT(*)::numeric * 100)
              END
            FROM user_activity
          ), 0)::text AS "goalAdoptionPercentage",
          COALESCE((
            SELECT
              CASE
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND(COUNT(*) FILTER (WHERE savings_total > 0)::numeric / COUNT(*)::numeric * 100)
              END
            FROM user_activity
          ), 0)::text AS "savingsParticipationPercentage",
          COALESCE((SELECT COUNT(*) FROM regular_users), 0)::text AS "historicalUsersTotal",
          COALESCE((
            SELECT
              CASE
                WHEN COUNT(*) FILTER (WHERE status = 1) = 0 THEN 0
                ELSE ROUND(
                  COUNT(*) FILTER (
                    WHERE status = 1
                      AND id IN (SELECT user_id FROM monthly_goal_users)
                  )::numeric
                  / (COUNT(*) FILTER (WHERE status = 1))::numeric
                  * 100
                )
              END
            FROM user_activity
          ), 0)::text AS "monthlyGoalContributionUserPercentage",
          COALESCE((
            SELECT
              CASE
                WHEN COUNT(*) FILTER (WHERE status = 1) = 0 THEN 0
                ELSE ROUND(
                  COUNT(*) FILTER (
                    WHERE status = 1
                      AND id IN (SELECT user_id FROM monthly_income_users)
                      AND id IN (SELECT user_id FROM monthly_expense_users)
                  )::numeric
                  / (COUNT(*) FILTER (WHERE status = 1))::numeric
                  * 100
                )
              END
            FROM user_activity
          ), 0)::text AS "monthlyIncomeExpenseUserPercentage"
      `,
    );

    return result.rows[0] ?? {
      goalCompletionPercentage: "0",
      activeUserPercentage: "0",
      goalAdoptionPercentage: "0",
      savingsParticipationPercentage: "0",
      historicalUsersTotal: "0",
      monthlyGoalContributionUserPercentage: "0",
      monthlyIncomeExpenseUserPercentage: "0",
    };
  }

  async listUsers(currentAdminId: string): Promise<AdminDashboardUserRow[]> {
    const result = await this.pool.query<AdminDashboardUserRow>(
      `
        WITH goal_totals AS (
          SELECT
            g.id,
            g.user_id,
            g.target_amount,
            COALESCE(SUM(d.amount), 0) AS saved_amount
          FROM goals g
          LEFT JOIN goal_deposits d
            ON d.goal_id = g.id
           AND d.user_id = g.user_id
          WHERE g.status <> 'cancelled'
          GROUP BY g.id
        )
        SELECT
          u.id,
          u.full_name AS "fullName",
          u.nickname,
          u.email,
          u.age,
          u.status,
          u.id_rol AS "roleId",
          r.name AS "roleLabel",
          COALESCE(COUNT(gt.id), 0)::text AS "goalsTotal",
          COALESCE(
            COUNT(gt.id) FILTER (WHERE gt.saved_amount >= gt.target_amount),
            0
          )::text AS "goalsCompleted",
          COALESCE(
            CASE
              WHEN COUNT(gt.id) = 0 THEN 0
              ELSE ROUND(
                COUNT(gt.id) FILTER (WHERE gt.saved_amount > 0)::numeric
                / COUNT(gt.id)::numeric
                * 100
              )
            END,
            0
          )::text AS "savingsParticipationPercentage"
        FROM users u
        INNER JOIN roles r
          ON r.id = u.id_rol
        LEFT JOIN goal_totals gt
          ON gt.user_id = u.id
        WHERE u.id <> $1
        GROUP BY u.id, r.name
        ORDER BY u.status DESC, u.id_rol ASC, u.full_name ASC
      `,
      [currentAdminId],
    );

    return result.rows;
  }

  async deactivateUser(
    userId: string,
    currentAdminId: string,
  ): Promise<string | null> {
    const result = await this.pool.query<{ id: string }>(
      `
        UPDATE users
        SET status = 0
        WHERE id = $1
          AND id <> $2
          AND status = 1
        RETURNING id
      `,
      [userId, currentAdminId],
    );

    return result.rows[0]?.id ?? null;
  }

  async promoteUserToAdmin(userId: string): Promise<string | null> {
    const result = await this.pool.query<{ id: string }>(
      `
        UPDATE users
        SET id_rol = 2
        WHERE id = $1
          AND id_rol = 1
          AND status = 1
        RETURNING id
      `,
      [userId],
    );

    return result.rows[0]?.id ?? null;
  }
}
