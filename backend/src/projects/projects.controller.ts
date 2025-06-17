import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { 
  ApiBearerAuth, 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';
import { ProjectStatus, UserRole } from '@prisma/client';

import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/create-project.dto';

import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

import { AuthenticatedUser } from 'src/auth/interfaces/jwt.interface';

@ApiTags('projects')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new project (Admin only)' })
  @ApiResponse({ status: 201, description: 'Project created successfully', type: ProjectResponseDto })
  @ApiResponse({ status: 409, description: 'User already has an assigned project' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createProjectDto: CreateProjectDto): Promise<ProjectResponseDto> {
    return this.projectsService.createProject(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects with optional filtering' })
  @ApiQuery({ name: 'status', required: false, enum: ProjectStatus, description: 'Filter by project status' })
  @ApiQuery({ name: 'assignedUserId', required: false, type: String, description: 'Filter by assigned user ID' })
  @ApiQuery({ name: 'unassigned', required: false, type: Boolean, description: 'Show only unassigned projects' })
  @ApiQuery({ name: 'overdue', required: false, type: Boolean, description: 'Show only overdue projects' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name or description' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully', type: [ProjectResponseDto] })
  async findAll(
    @Query('status') status?: ProjectStatus,
    @Query('assignedUserId') assignedUserId?: string,
    @Query('unassigned') unassigned?: string,
    @Query('overdue') overdue?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<ProjectResponseDto[]> {
    // For regular users, only show their assigned project
    if (user?.role === UserRole.USER) {
      const userProject = await this.projectsService.findProjectByUserId(user.id);
      return userProject ? [userProject] : [];
    }

    // Admin can see all projects with filters
    return this.projectsService.findAllProjects(
      status,
      assignedUserId,
      unassigned === 'true',
      overdue === 'true',
      search,
    );
  }

  @Get('my-project')
  @ApiOperation({ summary: 'Get current user assigned project' })
  @ApiResponse({ status: 200, description: 'User project retrieved successfully', type: ProjectResponseDto })
  @ApiResponse({ status: 404, description: 'No project assigned to user' })
  async getMyProject(@CurrentUser('id') userId: string): Promise<ProjectResponseDto | null> {
    return this.projectsService.findProjectByUserId(userId);
  }

  @Get('statistics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get project statistics (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Project statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        not_started: { type: 'number' },
        inProgress: { type: 'number' },
        completed: { type: 'number' },
        cancelled: { type: 'number' },
        unassigned: { type: 'number' },
        overdue: { type: 'number' }
      }
    }
  })
  async getStatistics(): Promise<any> {
    return this.projectsService.getProjectStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully', type: ProjectResponseDto })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsService.findOneProject(id);
    
    // Regular users can only view their own assigned project
    if (user.role === UserRole.USER && project.assignedUser?.id !== user.id) {
      const userProject = await this.projectsService.findProjectByUserId(user.id);
      if (!userProject || userProject.id !== id) {
        throw new Error('Project not found');
      }
    }

    return project;
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update project by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project updated successfully', type: ProjectResponseDto })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.updateProject(id, updateProjectDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update project status' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project status updated successfully', type: ProjectResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: ProjectStatus,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectResponseDto> {
    // Users can only update status of their assigned project
    if (user.role === UserRole.USER) {
      const userProject = await this.projectsService.findProjectByUserId(user.id);
      if (!userProject || userProject.id !== id) {
        throw new Error('Project not found or not assigned to you');
      }
    }

    return this.projectsService.updateProjectStatus(id, status);
  }

  @Post(':projectId/assign/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign user to project (Admin only)' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User assigned to project successfully', type: ProjectResponseDto })
  @ApiResponse({ status: 404, description: 'Project or user not found' })
  @ApiResponse({ status: 409, description: 'Project already assigned or user has existing project' })
  async assignUser(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.assignUserProject(projectId, userId);
  }

  @Delete(':projectId/unassign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unassign user from project (Admin only)' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'User unassigned from project successfully', type: ProjectResponseDto })
  @ApiResponse({ status: 400, description: 'Project has no assigned user' })
  async unassignUser(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.unassignUserProject(projectId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark project as completed' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project marked as completed', type: ProjectResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot complete project in current status' })
  async completeProject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectResponseDto> {
    // Users can only complete their assigned project
    if (user.role === UserRole.USER) {
      const userProject = await this.projectsService.findProjectByUserId(user.id);
      if (!userProject || userProject.id !== id) {
        throw new Error('Project not found or not assigned to you');
      }
    }

    return this.projectsService.updateProjectStatus(id, ProjectStatus.COMPLETED);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete project (Admin only)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return this.projectsService.deleteProject(id);
  }
}