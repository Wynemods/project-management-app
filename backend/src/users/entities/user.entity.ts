import { UserRole } from 'generated/prisma';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  profileImage?: string;
  is_active: boolean;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  profileImage?: string;
  is_active: boolean;
}