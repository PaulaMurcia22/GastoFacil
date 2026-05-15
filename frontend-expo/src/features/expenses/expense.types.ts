import { ExpenseType } from "./expense.constants";

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface ExpenseItem {
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

export interface ExpenseListResponse {
  items: ExpenseItem[];
}

export interface ExpenseDetailResponse {
  item: ExpenseItem;
}

export interface ExpenseCategoriesResponse {
  items: ExpenseCategory[];
}

export interface CreateExpensePayload {
  amount: number;
  categoryId: string;
  expenseDate: string;
  expenseType: ExpenseType;
  frequencyMonths?: number;
  description?: string;
}

export interface CreateExpenseResponse {
  message: string;
  item: ExpenseItem;
}