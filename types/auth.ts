export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    username?: string;
    avatar_url?: string;
  };
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
}


