import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

import { EXPENSE_TYPES, type ExpenseType } from "../expenses.constants";

export class CreateExpenseDto {
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
    { message: "La fecha del gasto debe estar en formato YYYY-MM-DD." },
  )
  expenseDate!: string;

  @IsEnum(EXPENSE_TYPES, {
    message: "El tipo de gasto seleccionado no es valido.",
  })
  expenseType!: ExpenseType;

  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: "La frecuencia debe ser un numero entero." })
  @Min(1, { message: "La frecuencia debe ser mayor a 0." })
  frequencyMonths?: number;

  @IsOptional()
  @IsString({ message: "La descripcion debe ser un texto." })
  @MaxLength(255, {
    message: "La descripcion no puede superar los 255 caracteres.",
  })
  description?: string;
}