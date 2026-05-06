export interface HomeUser {
  id: string;
  fullName: string;
  nickname: string;
  email: string;
  age: number;
  status: number;
}

export interface HomeData {
  message: string;
  expiresAt: string;
  user: HomeUser;
}
