import { UserRole } from "@prisma/client";

export interface User {
    id: string;
    email: string;
    name: string;
    password: string;
    role: UserRole;
    projectId?: string | null;
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date | null;
    isActive: boolean;

    profileImageId:  string | null;
    profileImageUrl: string | null;
}