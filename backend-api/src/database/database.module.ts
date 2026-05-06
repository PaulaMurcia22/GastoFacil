import { Global, Module } from "@nestjs/common";
import { Pool } from "pg";

import { getAppConfig } from "../config/env";
import { PG_POOL } from "./database.constants";

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: async () => {
        const config = getAppConfig();
        const pool = new Pool({
          connectionString: config.databaseUrl,
          max: 10,
          idleTimeoutMillis: 30000,
        });

        await pool.query("SELECT 1");

        return pool;
      },
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
