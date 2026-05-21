import { Type } from "class-transformer";
import { IsNumber, Min } from "class-validator";

export class UpdateGoalContributionDto {
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: "El monto del aporte debe ser un numero valido con hasta 2 decimales." },
  )
  @Min(0.01, { message: "El monto del aporte debe ser mayor a 0." })
  amount!: number;
}

