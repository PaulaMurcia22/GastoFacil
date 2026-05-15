import { ExpenseType } from "../expenses.constants";

export interface ExpenseResponse {
  id: string;
  amount: number;
  expenseDate: string;
  expenseType: ExpenseType;
  expenseTypeLabel: string;
  frequencyMonths: number | null;
  frequencyLabel: string | null;
  description: string | null;
  status: number;
  createdAt: string | null;
  category: {
    id: string;
    name: string;
  };
}