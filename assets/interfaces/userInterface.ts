export interface User {
  id: string;
  userName: string;
  email: string;
  password: string;
  profileImageUrl?: string; // optional URL or base64 string of profile image
  createdAt?: Date;
  updatedAt?: Date;
}
