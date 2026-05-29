import { Module } from "@nestjs/common";

import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { ExpensesModule } from "./expenses/expenses.module";
import { GoalsModule } from "./goals/goals.module";
import { IncomesModule } from "./incomes/incomes.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    IncomesModule,
    ExpensesModule,
    GoalsModule,
    AdminModule,
  ],
})
export class AppModule {}
