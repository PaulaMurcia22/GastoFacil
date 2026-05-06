import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail()
  @MaxLength(160)
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : "",
  )
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
