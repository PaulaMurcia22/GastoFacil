export interface UserRecord {
  id: string;
  full_name: string;
  nickname: string;
  email: string;
  age: number;
  status: number;
  id_rol: number;
  password_hash: string;
  audit: Record<string, unknown>;
}
