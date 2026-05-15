import { Request } from "express";

import { JwtPayload } from "./jwt";

export interface SessionRequest extends Request {
  user: JwtPayload;
}
