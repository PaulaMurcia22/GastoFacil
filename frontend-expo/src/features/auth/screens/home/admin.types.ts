export interface AdminDashboardStats {
  goalCompletionPercentage: number;
  activeUserPercentage: number;
  goalAdoptionPercentage: number;
  savingsParticipationPercentage: number;
}

export interface AdminDashboardUser {
  id: string;
  fullName: string;
  nickname: string;
  email: string;
  age: number;
  status: number;
  roleId: number;
  roleLabel: string;
  goalsTotal: number;
  goalsCompleted: number;
  savingsParticipationPercentage: number;
}

export interface AdminDashboardResponse {
  stats: AdminDashboardStats;
  users: AdminDashboardUser[];
}
