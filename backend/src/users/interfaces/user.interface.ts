import { UserRole } from "generated/prisma";

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    projectId?: string | null;
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date | null;
    isActive: boolean;
}