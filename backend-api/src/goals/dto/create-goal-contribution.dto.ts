import { Type } from "class-transformer";
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateGoalContributionDto {
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: "El monto del aporte debe ser un numero valido con hasta 2 decimales." },
  )
  @Min(0.01, { message: "El monto del aporte debe ser mayor a 0." })
  amount!: number;

  @IsOptional()
  @IsDateString(
    {},
    { message: "La fecha del aporte debe estar en formato YYYY-MM-DD." },
  )
  contributionDate?: string;

  @IsOptional()
  @IsString({ message: "La nota debe ser un texto." })
  @MaxLength(255, {
    message: "La nota no puede superar los 255 caracteres.",
  })
  note?: string;
}

