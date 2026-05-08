export interface SessionUser {
  id: string;
  fullName: string;
  nickname: string;
  email: string;
  age: number;
  status: number;
  idRol: number;
}

export interface SessionResponse {
  message: string;
  expiresAt: string;
  user: SessionUser;
}

export interface IssuedSession extends SessionResponse {
  accessToken: string;
}
