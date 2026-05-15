import { Module } from "@nestjs/common";

import { SessionGuard } from "../auth/session/session.guard";
import { IncomesController } from "./incomes.controller";
import { IncomesRepository } from "./incomes.repository";
import { IncomesService } from "./incomes.service";

@Module({
  controllers: [IncomesController],
  providers: [IncomesService, IncomesRepository, SessionGuard],
})
export class IncomesModule {}
