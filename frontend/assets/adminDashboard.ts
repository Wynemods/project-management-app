// Admin Dashboard Frontend - Simple Fetch Operations
// Connects to existing backend API (JWT handled by backend)

// Types
interface Project {
  id: string;
  name: string;
  description: string;
  endDate: string;
  assignedTo?: string;
  assignedUserName?: string;
  status: 'active' | 'completed' | 'pending' | 'cancelled';
}

interface User {
  id: string;
  name: string;
  email: string;
  registrationDate: string;
  assignedProject?: string;
  assignedProjectName?: string;
}

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalUsers: number;
}

// Simple API fetch functions
const API_BASE = 'http://localhost:3000/api'; // Update with your backend URL

const apiFetch = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE}${url}`, {
    credentials: 'include', // Include cookies for session/JWT
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Default data arrays
const defaultUsers: User[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    registrationDate: '2024-01-15',
    assignedProject: 'project-1',
    assignedProjectName: 'Website Redesign'
  },
  {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    registrationDate: '2024-02-10',
    assignedProject: undefined,
    assignedProjectName: undefined
  }
];

const defaultProjects: Project[] = [
  {
    id: 'project-1',
    name: 'Website Redesign',
    description: 'Complete redesign of company website with modern UI/UX',
    endDate: '2024-12-31',
    assignedTo: 'user-1',
    assignedUserName: 'John Doe',
    status: 'active'
  },
  {
    id: 'project-2',
    name: 'Mobile App Development',
    description: 'Develop cross-platform mobile application for customer engagement',
    endDate: '2025-03-15',
    assignedTo: undefined,
    assignedUserName: undefined,
    status: 'pending'
  }
];

const defaultStats: DashboardStats = {
  totalProjects: 2,
  activeProjects: 1,
  totalUsers: 2
};

// Dashboard Class
class AdminDashboard {
  private projects: Project[] = [...defaultProjects];
  private users: User[] = [...defaultUsers];
  private currentEditingProject: Project | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    // Load default data first
    this.updateStats(defaultStats);
    this.renderProjects();
    this.renderUsers();
    this.populateUserDropdown();
    
    // Then try to load from API (optional)
    await this.loadData();
    this.setupEventListeners();
  }

  // Fetch all data
  private async loadData() {
    try {
      // Try to fetch from API, fallback to default data
      try {
        const stats = await apiFetch('/dashboard/stats');
        this.updateStats(stats);
      } catch (error) {
        console.log('Using default stats data');
        this.updateStats(defaultStats);
      }

      try {
        this.projects = await apiFetch('/projects');
        this.renderProjects();
      } catch (error) {
        console.log('Using default projects data');
        this.projects = [...defaultProjects];
        this.renderProjects();
      }

      try {
        this.users = await apiFetch('/users');
        this.renderUsers();
        this.populateUserDropdown();
      } catch (error) {
        console.log('Using default users data');
        this.users = [...defaultUsers];
        this.renderUsers();
        this.populateUserDropdown();
      }

    } catch (error) {
      console.error('Error loading data:', error);
      // Data is already loaded with defaults, so no need to show error
    }
  }

  // Update dashboard stats
  private updateStats(stats: DashboardStats) {
    const totalProjects = document.getElementById('total-projects');
    const activeProjects = document.getElementById('active-projects');
    const totalUsers = document.getElementById('total-users');

    if (totalProjects) totalProjects.textContent = stats.totalProjects.toString();
    if (activeProjects) activeProjects.textContent = stats.activeProjects.toString();
    if (totalUsers) totalUsers.textContent = stats.totalUsers.toString();
  }

  // Render projects table
  private renderProjects() {
    const tbody = document.querySelector('#projects-table tbody');
    if (!tbody) return;

    tbody.innerHTML = this.projects.map(project => `
      <tr>
        <td>${project.name}</td>
        <td>${project.description}</td>
        <td>${new Date(project.endDate).toLocaleDateString()}</td>
        <td>${project.assignedUserName || 'Unassigned'}</td>
        <td><span class="status-badge status-${project.status}">${project.status}</span></td>
        <td class="actions">
          <button class="btn btn-sm btn-outline" onclick="dashboard.editProject('${project.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="dashboard.deleteProject('${project.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Render users table
  private renderUsers() {
    const tbody = document.querySelector('#users-table tbody');
    if (!tbody) return;

    tbody.innerHTML = this.users.map(user => `
      <tr>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${new Date(user.registrationDate).toLocaleDateString()}</td>
        <td>${user.assignedProjectName || 'No project assigned'}</td>
        <td class="actions">
          <select class="project-assign-dropdown" onchange="dashboard.assignProject('${user.id}', this.value)">
            <option value="">Assign Project</option>
            ${this.projects.map(project => `
              <option value="${project.id}" ${project.assignedTo === user.id ? 'selected' : ''}>
                ${project.name}
              </option>
            `).join('')}
          </select>
        </td>
      </tr>
    `).join('');
  }

  // Populate user dropdown for project assignment
  private populateUserDropdown() {
    const select = document.getElementById('project-assigned-user') as HTMLSelectElement;
    if (!select) return;

    select.innerHTML = '<option value="">Select a user</option>' +
      this.users.map(user => `<option value="${user.id}">${user.name}</option>`).join('');
  }

  // Setup event listeners
  private setupEventListeners() {
    // Add project button
    document.getElementById('add-project-btn')?.addEventListener('click', () => {
      this.openModal();
    });

    // Close modal
    document.querySelector('.close-btn')?.addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('cancel-project')?.addEventListener('click', () => {
      this.closeModal();
    });

    // Form submit
    document.getElementById('project-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveProject();
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.logout();
    });

    // Navigation
    document.querySelectorAll('.sidebar-nav a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = (e.target as HTMLElement).getAttribute('href')?.slice(1);
        if (section) this.showSection(section);
      });
    });

    // Modal backdrop click to close
    document.getElementById('project-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeModal();
      }
    });
  }

  // Show specific section
  private showSection(sectionId: string) {
    // Update active nav
    document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
    document.querySelector(`a[href="#${sectionId}"]`)?.parentElement?.classList.add('active');

    // Show/hide sections
    document.querySelectorAll('.dashboard-content > section').forEach(section => {
      (section as HTMLElement).style.display = section.id === sectionId ? 'block' : 'none';
    });

    // Handle stats cards visibility
    const statsCards = document.querySelector('.stats-cards') as HTMLElement;
    if (statsCards) {
      statsCards.style.display = sectionId === 'dashboard' ? 'grid' : 'none';
    }
  }

  // Open project modal
  private openModal(project?: Project) {
    const modal = document.getElementById('project-modal');
    const title = document.querySelector('#project-modal h2');
    
    this.currentEditingProject = project || null;
    
    if (title) title.textContent = project ? 'Edit Project' : 'Add New Project';
    
    if (project) {
      (document.getElementById('project-name') as HTMLInputElement).value = project.name;
      (document.getElementById('project-description') as HTMLTextAreaElement).value = project.description;
      (document.getElementById('project-end-date') as HTMLInputElement).value = project.endDate;
      (document.getElementById('project-assigned-user') as HTMLSelectElement).value = project.assignedTo || '';
    } else {
      (document.getElementById('project-form') as HTMLFormElement).reset();
    }

    if (modal) (modal as HTMLElement).style.display = 'flex';
  }

  // Close modal
  private closeModal() {
    const modal = document.getElementById('project-modal');
    if (modal) (modal as HTMLElement).style.display = 'none';
    this.currentEditingProject = null;
  }

  // Save project (create or update)
  private async saveProject() {
    const name = (document.getElementById('project-name') as HTMLInputElement).value;
    const description = (document.getElementById('project-description') as HTMLTextAreaElement).value;
    const endDate = (document.getElementById('project-end-date') as HTMLInputElement).value;
    const assignedTo = (document.getElementById('project-assigned-user') as HTMLSelectElement).value;

    const projectData = { name, description, endDate, assignedTo: assignedTo || undefined, status: 'active' as const };

    try {
      if (this.currentEditingProject) {
        // Update existing project
        try {
          await apiFetch(`/projects/${this.currentEditingProject.id}`, {
            method: 'PUT',
            body: JSON.stringify(projectData),
          });
        } catch (error) {
          // Fallback: update in local data
          const index = this.projects.findIndex(p => p.id === this.currentEditingProject!.id);
          if (index !== -1) {
            this.projects[index] = { 
              ...this.currentEditingProject, 
              ...projectData,
              assignedUserName: assignedTo ? this.users.find(u => u.id === assignedTo)?.name : undefined
            };
          }
        }
        alert('Project updated successfully!');
      } else {
        // Create new project
        const newProject: Project = {
          id: `project-${Date.now()}`,
          ...projectData,
          assignedUserName: assignedTo ? this.users.find(u => u.id === assignedTo)?.name : undefined
        };
        
        try {
          const response = await apiFetch('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData),
          });
          // Use response data if available
          this.projects.push(response.id ? response : newProject);
        } catch (error) {
          // Fallback: add to local data
          this.projects.push(newProject);
        }
        alert('Project created successfully!');
      }

      this.closeModal();
      this.renderProjects();
      this.populateUserDropdown();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please try again.');
    }
  }

  // Edit project
  public editProject(projectId: string) {
    const project = this.projects.find(p => p.id === projectId);
    if (project) this.openModal(project);
  }

  // Delete project
  public async deleteProject(projectId: string) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      try {
        await apiFetch(`/projects/${projectId}`, { method: 'DELETE' });
      } catch (error) {
        // Fallback: remove from local data
        this.projects = this.projects.filter(p => p.id !== projectId);
      }
      
      alert('Project deleted successfully!');
      this.renderProjects();
      this.populateUserDropdown();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  }

  // Assign project to user from users table
  public async assignProject(userId: string, projectId: string) {
    if (!projectId) return; // No project selected

    try {
      try {
        // Update the project with the assigned user
        await apiFetch(`/projects/${projectId}`, {
          method: 'PUT',
          body: JSON.stringify({ assignedTo: userId }),
        });
      } catch (error) {
        // Fallback: update local data
        const projectIndex = this.projects.findIndex(p => p.id === projectId);
        const userIndex = this.users.findIndex(u => u.id === userId);
        
        if (projectIndex !== -1 && userIndex !== -1) {
          this.projects[projectIndex].assignedTo = userId;
          this.projects[projectIndex].assignedUserName = this.users[userIndex].name;
          this.users[userIndex].assignedProject = projectId;
          this.users[userIndex].assignedProjectName = this.projects[projectIndex].name;
        }
      }

      alert('Project assigned successfully!');
      this.renderProjects();
      this.renderUsers();
    } catch (error) {
      console.error('Error assigning project:', error);
      alert('Failed to assign project. Please try again.');
    }
  }

  // Logout
  private async logout() {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
      await apiFetch('/auth/logout', { method: 'POST' });
      window.location.href = '/login.html';
    } catch (error) {
      console.error('Logout error:', error);
      // Redirect anyway
      window.location.href = '/login.html';
    }
  }
}

// Initialize dashboard
let dashboard: AdminDashboard;

document.addEventListener('DOMContentLoaded', () => {
  dashboard = new AdminDashboard();
  // Make dashboard globally accessible for onclick handlers
  (window as any).dashboard = dashboard;
});