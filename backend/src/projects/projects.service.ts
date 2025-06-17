import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ProjectStatus, UserRole } from '@prisma/client';
import { getPrismaClient } from 'src/config/prisma.config';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/create-project.dto';
import { Project } from './interface/project.interface';
import { EmailService } from 'services/mailer/email.service';

@Injectable()
export class ProjectsService {
  private prisma = getPrismaClient();

  constructor(
    private readonly emailService: EmailService,
  ) {}

  async createProject(data: CreateProjectDto): Promise<ProjectResponseDto> {
    try {
      if (data.assignedUserId) {
        const user = await this.prisma.user.findUnique({
          where: { id: data.assignedUserId },
        });

        if (!user) {
          throw new NotFoundException(`User with id ${data.assignedUserId} not found`);
        }

        if (!user.isActive) {
          throw new BadRequestException('Cannot assign project to inactive user');
        }

        if (user.role === UserRole.ADMIN) {
          throw new BadRequestException('Cannot assign projects to admin users');
        }

        // Check if user already has a project
        const existingProject = await this.prisma.project.findFirst({
          where: { assignedUserId: data.assignedUserId },
        });

        if (existingProject) {
          throw new ConflictException('User already has an assigned project');
        }
      }

      if (data.endDate <= new Date()) {
        throw new BadRequestException('End date must be in the future');
      }

      const project = await this.prisma.project.create({
        data: {
          name: data.name,
          description: data.description ?? "",
          endDate: data.endDate,
          status: data.status || ProjectStatus.NOT_STARTED,
          assignedUser: data.assignedUserId ? { connect: { id: data.assignedUserId } } : undefined,
       },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
      });

      return this.toResponseDto(project);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      if (error.code === 'P2002') {
        throw new ConflictException('User already has an assigned project');
      }
      
      throw new InternalServerErrorException(`Failed to create project: ${error.message}`);
    }
  }

  async findAllProjects(
    status?: ProjectStatus,
    assignedUserId?: string,
    unassigned?: boolean,
    overdue?: boolean,
    search?: string,
  ): Promise<ProjectResponseDto[]> {
    try {
      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (assignedUserId) {
        where.assignedUserId = assignedUserId;
      }

      if (unassigned === true) {
        where.assignedUserId = null;
      }

      if (overdue === true) {
        where.endDate = { lt: new Date() };
        where.status = { notIn: [ProjectStatus.COMPLETED, ProjectStatus.NOT_STARTED] };
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const projects = await this.prisma.project.findMany({
        where,
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      });

      return projects.map(project => this.toResponseDto(project));
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve projects');
    }
  }

  async findOneProject(id: string): Promise<ProjectResponseDto> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
      });

      if (!project) {
        throw new NotFoundException(`Project with id ${id} not found`);
      }

      return this.toResponseDto(project);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve project');
    }
  }

  async findProjectByUserId(userId: string): Promise<ProjectResponseDto | null> {
    try {
      const project = await this.prisma.project.findFirst({
        where: { assignedUserId: userId },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
      });

      return project ? this.toResponseDto(project) : null;
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve user project');
    }
  }

  async updateProject(id: string, data: UpdateProjectDto): Promise<ProjectResponseDto> {
    try {
      const existingProject = await this.prisma.project.findUnique({
        where: { id },
        include: { assignedUser: true }
      });

      if (!existingProject) {
        throw new NotFoundException(`Project with id ${id} not found`);
      }

      if (data.assignedUserId !== undefined) {
        if (data.assignedUserId === null) {
        } else {
          const user = await this.prisma.user.findUnique({
            where: { id: data.assignedUserId },
          });

          if (!user) {
            throw new NotFoundException(`User with id ${data.assignedUserId} not found`);
          }

          if (!user.isActive) {
            throw new BadRequestException('Cannot assign project to inactive user');
          }

          if (user.role === UserRole.ADMIN) {
            throw new BadRequestException('Cannot assign projects to admin users');
          }

          if (data.assignedUserId !== existingProject.assignedUserId) {
            const existingUserProject = await this.prisma.project.findFirst({
              where: { 
                assignedUserId: data.assignedUserId,
                id: { not: id }
              },
            });

            if (existingUserProject) {
              throw new ConflictException('User already has an assigned project');
            }
          }
        }
      }

      if (data.endDate && data.endDate <= new Date()) {
        throw new BadRequestException('End date must be in the future');
      }

      if (data.status && existingProject.status !== data.status) {
        this.validateStatusTransition(existingProject.status, data.status);
      }

      const updateData: Partial<Project> = {};
      if (data.name) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.endDate) updateData.endDate = data.endDate;
      if (data.status) updateData.status = data.status;
      if (data.assignedUserId !== undefined) updateData.assignedUserId = data.assignedUserId;

      const updatedProject = await this.prisma.project.update({
        where: { id },
        data: updateData,
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
      });

      return this.toResponseDto(updatedProject);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update project');
    }
  }

  async assignUserProject(projectId: string, userId: string): Promise<ProjectResponseDto> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: { assignedUser: true }
      });

      if (!project) {
        throw new NotFoundException(`Project with id ${projectId} not found`);
      }

      if (project.assignedUser) {
        throw new ConflictException('Project is already assigned to a user');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }

      if (!user.isActive) {
        throw new BadRequestException('Cannot assign project to inactive user');
      }

      if (user.role === UserRole.ADMIN) {
        throw new BadRequestException('Cannot assign projects to admin users');
      }

      const existingProject = await this.prisma.project.findFirst({
        where: { assignedUserId: userId },
      });

      if (existingProject) {
        throw new ConflictException('User already has an assigned project');
      }

      const updatedProject = await this.prisma.project.update({
        where: { id: projectId },
        data: { assignedUserId: userId, status: ProjectStatus.IN_PROGRESS },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
      });

      if(updatedProject.assignedUser) {
        await this.emailService.sendProjectAssignmentEmail(
          updatedProject.assignedUser.email,{
            projectName: updatedProject.name,
            projectEndDate: updatedProject.endDate.toISOString(),
            dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/userDashboard`,
            name: updatedProject.assignedUser.name,
            email: updatedProject.assignedUser.email,
          }
        );
      }

      return this.toResponseDto(updatedProject);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to assign user to project');
    }
  }

  async unassignUserProject(projectId: string): Promise<ProjectResponseDto> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: { assignedUser: true }
      });

      if (!project) {
        throw new NotFoundException(`Project with id ${projectId} not found`);
      }

      if (!project.assignedUser) {
        throw new BadRequestException('Project has no assigned user');
      }

      const updatedProject = await this.prisma.project.update({
        where: { id: projectId },
        data: { assignedUserId: null },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
      });

      return this.toResponseDto(updatedProject);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to unassign user from project');
    }
  }

  async updateProjectStatus(id: string, status: ProjectStatus): Promise<ProjectResponseDto> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new NotFoundException(`Project with id ${id} not found`);
      }

      this.validateStatusTransition(project.status, status);

      const updatedProject = await this.prisma.project.update({
        where: { id },
        data: { status },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
      });

      if (status === ProjectStatus.COMPLETED && updatedProject.assignedUser) {
        await this.emailService.sendProjectCompletionEmail(
          updatedProject.assignedUser.email,{
            projectName: updatedProject.name,
            projectEndDate: updatedProject.endDate.toISOString(),
            dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/userDashboard`,
            name: updatedProject.assignedUser.name,
            email: updatedProject.assignedUser.email,
            completedDate: updatedProject.completedAt.toISOString(),
          }
        );
      }

      return this.toResponseDto(updatedProject);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update project status');
    }
  }

  async getProjectStatistics(): Promise<any> {
    try {
      const [
        total,
        not_started,
        inProgress,
        completed,
        cancelled,
        unassigned,
        overdue
      ] = await Promise.all([
        this.prisma.project.count(),
        this.prisma.project.count({ where: { status: ProjectStatus.NOT_STARTED } }),
        this.prisma.project.count({ where: { status: ProjectStatus.IN_PROGRESS } }),
        this.prisma.project.count({ where: { status: ProjectStatus.COMPLETED } }),
        this.prisma.project.count({ where: { status: ProjectStatus.CANCELLED } }),
        this.prisma.project.count({ where: { assignedUserId: null } }),
        this.prisma.project.count({
          where: {
            endDate: { lt: new Date() },
            status: { notIn: [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED] }
          }
        })
      ]);

      return {
        total,
        not_started,
        inProgress,
        completed,
        cancelled,
        unassigned,
        overdue,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve project statistics');
    }
  }

  async deleteProject(id: string): Promise<{ message: string }> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new NotFoundException(`Project with id ${id} not found`);
      }

      await this.prisma.project.delete({
        where: { id },
      });

      return { message: `Project "${project.name}" has been deleted successfully` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete project');
    }
  }

  private validateStatusTransition(currentStatus: ProjectStatus, newStatus: ProjectStatus): void {
    const validTransitions: Record<ProjectStatus, ProjectStatus[]> = {
      [ProjectStatus.NOT_STARTED]: [ProjectStatus.IN_PROGRESS, ProjectStatus.CANCELLED],
      [ProjectStatus.IN_PROGRESS]: [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED],
      [ProjectStatus.COMPLETED]: [],
      [ProjectStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  private toResponseDto(project: any): ProjectResponseDto {
    return new ProjectResponseDto({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      endDate: project.endDate,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      assignedUser: project.assignedUser ? {
        id: project.assignedUser.id,
        name: project.assignedUser.name,
        email: project.assignedUser.email,
        role: project.assignedUser.role,
        isActive: project.assignedUser.isActive,
      } : null,
    });
  }
}