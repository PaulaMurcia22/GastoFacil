import { Transform, Type } from "class-transformer";
import {
  IsEmail,
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : ""))
  fullName!: string;

  @IsEmail()
  @MaxLength(160)
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : "",
  )
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: "password must contain one uppercase letter" })
  @Matches(/[0-9]/, { message: "password must contain one number" })
  password!: string;

  @IsInt()
  @Min(13)
  @Max(100)
  @Type(() => Number)
  age!: number;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : ""))
  nickname!: string;
}
