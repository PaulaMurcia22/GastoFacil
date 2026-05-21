import { Type } from "class-transformer";
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

export class CreateGoalDto {
  @IsString({ message: "El nombre de la meta debe ser un texto." })
  @MaxLength(120, {
    message: "El nombre de la meta no puede superar los 120 caracteres.",
  })
  name!: string;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: "El monto objetivo debe ser un numero valido con hasta 2 decimales." },
  )
  @Min(0.01, { message: "El monto objetivo debe ser mayor a 0." })
  targetAmount!: number;

  @IsUUID("4", { message: "La categoria seleccionada no es valida." })
  categoryId!: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: "La fecha limite debe estar en formato YYYY-MM-DD." },
  )
  deadline?: string;

  @IsOptional()
  @IsString({ message: "La descripcion debe ser un texto." })
  @MaxLength(255, {
    message: "La descripcion no puede superar los 255 caracteres.",
  })
  description?: string;
}

