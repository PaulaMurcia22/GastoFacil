import { GoalStatus } from "../goals.constants";

export interface GoalContributionResponse {
  id: string;
  amount: number;
  contributionDate: string;
  note: string | null;
  createdAt: string | null;
}

export interface GoalResponse {
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

export interface GoalDetailResponse extends GoalResponse {
  contributions: GoalContributionResponse[];
}
