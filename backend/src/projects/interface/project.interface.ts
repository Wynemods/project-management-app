import { ProjectStatus } from 'generated/prisma';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  endDate: Date;
  assignedUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}