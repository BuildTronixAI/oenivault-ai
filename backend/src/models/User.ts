export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  role: 'admin' | 'customer';
  facility_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export type PublicUser = Omit<User, 'password_hash'>;

export function toPublicUser(user: User): PublicUser {
  const { password_hash: _, ...rest } = user;
  return rest;
}
