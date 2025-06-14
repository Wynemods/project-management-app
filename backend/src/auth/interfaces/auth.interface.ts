import { UserRole } from 'generated/prisma';

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    profileImage?: string;
  };
}