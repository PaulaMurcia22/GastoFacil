export type GoalStatus = "active" | "completed" | "cancelled";

export interface GoalCategory {
  id: string;
  name: string;
}

export interface GoalContribution {
  id: string;
  amount: number;
  contributionDate: string;
  note: string | null;
  createdAt: string | null;
}

export interface GoalItem {
  id: string;
  name: string;
  description: string | null;
  targetAmount: number;
  contributedThisMonth: number;
  savedAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  monthlyRequiredAmount: number | null;
  deadline: string | null;
  status: GoalStatus;
  statusLabel: string;
  createdAt: string | null;
  category: {
    id: string;
    name: string;
  };
}

export interface GoalDetail extends GoalItem {
  contributions: GoalContribution[];
}

export interface GoalListResponse {
  items: GoalItem[];
}

export interface GoalDetailResponse {
  item: GoalDetail;
}

export interface GoalCategoriesResponse {
  items: GoalCategory[];
}

export interface CreateGoalPayload {
  name: string;
  targetAmount: number;
  categoryId: string;
  deadline?: string;
  description?: string;
}

export interface CreateGoalResponse {
  message: string;
  item: GoalDetail;
}

export interface AddGoalContributionPayload {
  amount: number;
  contributionDate?: string;
  note?: string;
}

export interface UpdateGoalContributionPayload {
  amount: number;
}
