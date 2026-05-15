import { Module } from "@nestjs/common";

import { SessionGuard } from "../auth/session/session.guard";
import { ExpensesController } from "./expenses.controller";
import { ExpensesRepository } from "./expenses.repository";
import { ExpensesService } from "./expenses.service";

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpensesRepository, SessionGuard],
})
export class ExpensesModule {}