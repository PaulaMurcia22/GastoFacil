import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";

import { RegisterService } from "./register.service";
import { RegisterDto } from "./dto/register.dto";

@Controller("api/v1/auth")
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.registerService.register(dto);
  }
}
