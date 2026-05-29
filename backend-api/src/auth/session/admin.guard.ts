import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

import { SessionRequest } from "./session-request.interface";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    const role = request.user?.id_rol ?? 1;

    if (role !== 2) {
      throw new ForbiddenException("No tienes permisos de administrador.");
    }

    return true;
  }
}
