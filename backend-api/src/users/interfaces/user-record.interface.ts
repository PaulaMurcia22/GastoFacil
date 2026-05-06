export interface UserRecord {
  id: string;
  full_name: string;
  nickname: string;
  email: string;
  age: number;
  status: number;
  password_hash: string;
  audit: Record<string, unknown>;
}
