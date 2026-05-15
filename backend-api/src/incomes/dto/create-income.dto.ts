import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

import {
  INCOME_PERIODICITIES,
  type IncomePeriodicity,
} from "../incomes.constants";

export class CreateIncomeDto {
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: "El monto debe ser un numero valido con hasta 2 decimales." },
  )
  @Min(0.01, { message: "El monto debe ser mayor a 0." })
  amount!: number;

  @IsUUID("4", { message: "La categoria seleccionada no es valida." })
  categoryId!: string;

  @IsDateString(
    {},
    { message: "La fecha del ingreso debe estar en formato YYYY-MM-DD." },
  )
  incomeDate!: string;

  @IsEnum(INCOME_PERIODICITIES, {
    message: "La periodicidad seleccionada no es valida.",
  })
  periodicity!: IncomePeriodicity;

  @IsOptional()
  @IsString({ message: "La descripcion debe ser un texto." })
  @MaxLength(255, {
    message: "La descripcion no puede superar los 255 caracteres.",
  })
  description?: string;
}
