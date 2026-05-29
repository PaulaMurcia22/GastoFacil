import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";

import { PG_POOL } from "../database/database.constants";

export interface AdminDashboardStatsRow {
  goalCompletionPercentage: string;
  activeUserPercentage: string;
  goalAdoptionPercentage: string;
  savingsParticipationPercentage: string;
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
        WITH regular_users AS (
          SELECT id, status
          FROM users
          WHERE id_rol = 1
        ),
        goal_totals AS (
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
          GROUP BY u.id
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
          ), 0)::text AS "savingsParticipationPercentage"
      `,
    );

    return result.rows[0] ?? {
      goalCompletionPercentage: "0",
      activeUserPercentage: "0",
      goalAdoptionPercentage: "0",
      savingsParticipationPercentage: "0",
    };
  }

  async listUsers(): Promise<AdminDashboardUserRow[]> {
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
        GROUP BY u.id, r.name
        ORDER BY u.status DESC, u.id_rol ASC, u.full_name ASC
      `,
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
