import { Module } from "@nestjs/common";

import { SessionGuard } from "../auth/session/session.guard";
import { GoalsController } from "./goals.controller";
import { GoalsRepository } from "./goals.repository";
import { GoalsService } from "./goals.service";

@Module({
  controllers: [GoalsController],
  providers: [GoalsService, GoalsRepository, SessionGuard],
})
export class GoalsModule {}

