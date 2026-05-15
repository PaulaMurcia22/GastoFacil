import { IncomePeriodicity } from "../incomes.constants";

export interface IncomeResponse {
  id: string;
  amount: number;
  incomeDate: string;
  periodicity: IncomePeriodicity;
  periodicityLabel: string;
  description: string | null;
  status: number;
  createdAt: string | null;
  category: {
    id: string;
    name: string;
  };
}
