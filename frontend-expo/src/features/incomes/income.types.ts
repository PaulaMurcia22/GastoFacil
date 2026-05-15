export type IncomePeriodicity = "monthly" | "biweekly" | "one_time";

export interface IncomeCategory {
  id: string;
  name: string;
}

export interface IncomeItem {
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

export interface IncomeListResponse {
  items: IncomeItem[];
}

export interface IncomeDetailResponse {
  item: IncomeItem;
}

export interface IncomeCategoriesResponse {
  items: IncomeCategory[];
}

export interface CreateIncomePayload {
  amount: number;
  categoryId: string;
  incomeDate: string;
  periodicity: IncomePeriodicity;
  description?: string;
}

export interface CreateIncomeResponse {
  message: string;
  item: IncomeItem;
}
