import { Type } from "class-transformer";
import { IsIn, IsInt } from "class-validator";

import { RegisterDto } from "../../auth/register/dto/register.dto";

export class CreateAdminUserDto extends RegisterDto {
  @IsInt()
  @IsIn([1, 2])
  @Type(() => Number)
  roleId!: number;
}
