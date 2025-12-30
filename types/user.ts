export interface User {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  is_admin?: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}


