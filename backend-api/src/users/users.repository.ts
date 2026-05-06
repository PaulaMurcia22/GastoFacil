import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";

import { PG_POOL } from "../database/database.constants";
import { UserRecord } from "./interfaces/user-record.interface";

interface CreateUserParams {
  fullName: string;
  nickname: string;
  email: string;
  age: number;
  passwordHash: string;
}

@Injectable()
export class UsersRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await this.pool.query<UserRecord>(
      `
        CALL public.sp_get_user_by_email(
          $1::varchar,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL
        )
      `,
      [email],
    );

    const user = result.rows[0];

    if (!user?.id) {
      return null;
    }

    return user;
  }

  async create(params: CreateUserParams): Promise<UserRecord> {
    await this.pool.query(
      `
        CALL sp_create_user($1, $2, $3, $4, $5)
      `,
      [
        params.fullName,
        params.nickname,
        params.email,
        params.age,
        params.passwordHash,
      ],
    );

    const result = await this.pool.query<UserRecord>(
      `
        SELECT
          id,
          full_name,
          nickname,
          email,
          age,
          status,
          password_hash,
          audit
        FROM users
        WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
        LIMIT 1
      `,
      [params.email],
    );

    return result.rows[0] as UserRecord;
  }
}
