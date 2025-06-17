interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  isActive: boolean;
}

interface Project {
  id: string;
  name: string;
  description: string;
  endDate: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  assignedUser: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface createProject {
  name: string;
  description: string;
  status: "NOT_STARTED";
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
  assignedUserId: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class AdminDashboard {
  private baseUrl = "http://localhost:3000";
  private token: string | null = null;

  constructor() {
    console.log("AdminDashboard initializing...");
    this.init();
  }

  // Fixed: Made authFetch a proper class method and consolidated with apiRequest
  async authFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem("authToken");

    if (!token) {
      throw new Error("No auth token found");
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    };
    console.info("MAKING API CALL TO :", url);

    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("authToken");
        this.showError("Session expired. Please login again.");
        // window.location.href = 'login.html';
        throw new Error("Authentication failed");
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = response.json() as Promise<T>;

    console.log(result);
    return result;
  }

  private init(): void {
    console.log("AdminDashboard init() called");

    this.token = localStorage.getItem("authToken");
    console.log("Token found:", !!this.token);

    if (!this.token) {
      console.warn("No token found");
      this.showError("No authentication token found. Please login first.");
      return;
    }

    this.loadDashboard();
    this.setupEventListeners();
  }

  private async loadDashboard(): Promise<void> {
    console.log("Loading dashboard data...");

    try {
      this.showLoading(true);

      // Load data with better error handling
      const results = await Promise.allSettled([
        this.loadStatistics(),
        this.loadProjects(),
        this.loadUsers(),
        this.loadUsersForDropdown(),
      ]);

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(`Failed to load data ${index}:`, result.reason);
        }
      });

      this.showLoading(false);
      console.log("Dashboard loading completed");
    } catch (error) {
      console.error("Error loading dashboard:", error);
      this.showError("Failed to load dashboard data");
      this.showLoading(false);
    }
  }

  private showLoading(show: boolean): void {
    const statValues = document.querySelectorAll(".stat-value");
    statValues.forEach((element) => {
      if (show) {
        element.textContent = "Loading...";
      }
    });
  }

  private async loadStatistics(): Promise<void> {
    try {
      console.log("Loading statistics...");

      const [projectsResponse, usersResponse] = await Promise.all([
        this.authFetch<Project[]>("/projects"),
        this.authFetch<User[]>("/users"),
      ]);

      const projects = projectsResponse || [];
      const users = usersResponse || [];

      const totalProjects = projects.length;
      // Fixed: Changed to IN_PROGRESS for active projects (more logical)
      const activeProjects = projects.filter(
        (p) => p.status === "IN_PROGRESS"
      ).length;
      const totalUsers = users.length;

      console.log("Statistics:", { totalProjects, activeProjects, totalUsers });

      this.updateElement("total-projects", totalProjects.toString());
      this.updateElement("active-projects", activeProjects.toString());
      this.updateElement("total-users", totalUsers.toString());
    } catch (error) {
      console.error("Error loading statistics:", error);
      // Set fallback values
      this.updateElement("total-projects", "0");
      this.updateElement("active-projects", "0");
      this.updateElement("total-users", "0");
    }
  }

  private async loadProjects(): Promise<void> {
    try {
      console.log("Loading projects...");

      const response = await this.authFetch<Project[]>("/projects");
      const projects = response || [];

      console.log("Projects loaded:", projects.length);

      const tbody = document.querySelector("#projects-table tbody");
      if (!tbody) {
        console.error("Projects table tbody not found");
        return;
      }

      tbody.innerHTML = "";

      if (projects.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="6" style="text-align: center;">No projects found</td></tr>';
        return;
      }

      projects.forEach((project) => {
        const row = this.createProjectRow(project);
        tbody.appendChild(row);
      });
    } catch (error) {
      console.error("Error loading projects:", error);
      const tbody = document.querySelector("#projects-table tbody");
      if (tbody) {
        tbody.innerHTML =
          '<tr><td colspan="6" style="text-align: center; color: red;">Error loading projects</td></tr>';
      }
    }
  }

  private createProjectRow(project: Project): HTMLTableRowElement {
    const row = document.createElement("tr");

    const endDate = this.formatDate(project.endDate);
    const assignedName = project.assignedUser
      ? this.escapeHtml(project.assignedUser.name)
      : "Unassigned";

    // Fixed: Ensure consistent HTML escaping for security
    row.innerHTML = `
      <td>${this.escapeHtml(project.name)}</td>
      <td>${this.escapeHtml(project.description)}</td>
      <td>${this.escapeHtml(endDate)}</td>
      <td>${assignedName}</td>
      <td>
        <span class="status-badge status-${this.escapeHtml(
          project.status.toLowerCase()
        )}">
          ${this.escapeHtml(project.status)}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-sm btn-outline" onclick="window.adminDashboard.editProject('${this.escapeHtml(
            project.id
          )}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          ${
            project.status === "NOT_STARTED" || project.status === "IN_PROGRESS"
              ? `<button class="btn btn-sm btn-success" onclick="window.adminDashboard.completeProject('${this.escapeHtml(
                  project.id
                )}')">
              <i class="fas fa-check"></i> Complete
            </button>`
              : ""
          }
          <button class="btn btn-sm btn-danger" onclick="window.adminDashboard.deleteProject('${this.escapeHtml(
            project.id
          )}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </td>
    `;

    return row;
  }

  private async loadUsers(): Promise<void> {
    try {
      console.log("Loading users...");

      const response = await this.authFetch<User[]>("/users");
      const users = response || [];

      console.log("Users loaded:", users.length);

      const tbody = document.querySelector("#users-table tbody");
      if (!tbody) {
        console.error("Users table tbody not found");
        return;
      }

      tbody.innerHTML = "";

      if (users.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="4" style="text-align: center;">No users found</td></tr>';
        return;
      }

      users.forEach((user) => {
        const row = this.createUserRow(user);
        tbody.appendChild(row);
      });
    } catch (error) {
      console.error("Error loading users:", error);
      const tbody = document.querySelector("#users-table tbody");
      if (tbody) {
        tbody.innerHTML =
          '<tr><td colspan="4" style="text-align: center; color: red;">Error loading users</td></tr>';
      }
    }
  }

  private createUserRow(user: User): HTMLTableRowElement {
    const row = document.createElement("tr");

    // Fixed: Consistent HTML escaping
    row.innerHTML = `
      <td>${this.escapeHtml(user.name)}</td>
      <td>${this.escapeHtml(user.email)}</td>
      <td>${this.escapeHtml(this.formatDate(user.createdAt))}</td>
      <td id="user-project-${this.escapeHtml(user.id)}">Loading...</td>
    `;

    // Load user's assigned project asynchronously
    this.loadUserProject(user.id);

    return row;
  }

  private async loadUserProject(userId: string): Promise<void> {
    try {
      const response = await this.authFetch<ApiResponse<Project[]>>(
        "/projects"
      );
      const projects = response.data || [];
      const userProject = projects.find((p) => p.assignedUser?.id === userId);

      const cell = document.getElementById(`user-project-${userId}`);
      if (cell) {
        cell.textContent = userProject
          ? userProject.name
          : "No project assigned";
      }
    } catch (error) {
      console.error(`Error loading project for user ${userId}:`, error);
      const cell = document.getElementById(`user-project-${userId}`);
      if (cell) {
        cell.textContent = "Error loading";
      }
    }
  }

  private async loadUsersForDropdown(): Promise<void> {
    try {
      console.log("Loading users for dropdown...");

      const response = await this.authFetch<User[]>("/users");
      const users = response || [];

      const select = document.getElementById(
        "project-assigned-user"
      ) as HTMLSelectElement;
      if (!select) {
        console.error("Project assigned user select not found");
        return;
      }

      // Clear existing options except the first one
      select.innerHTML = '<option value="">Select a user</option>';

      users.forEach((user) => {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = user.name;
        select.appendChild(option);
      });

      console.log("Users dropdown populated with", users.length, "users");
    } catch (error) {
      console.error("Error loading users for dropdown:", error);
    }
  }

  private setupEventListeners(): void {
    console.log("Setting up event listeners...");

    // Add project button
    const addProjectBtn = document.getElementById("add-project-btn");
    if (addProjectBtn) {
      addProjectBtn.addEventListener("click", () => {
        console.log("Add project button clicked");
        this.openProjectModal();
      });
    } else {
      console.error("Add project button not found");
    }

    // Modal close button
    const closeBtn = document.querySelector(".close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        console.log("Modal close button clicked");
        this.closeProjectModal();
      });
    }

    // Cancel button
    const cancelBtn = document.getElementById("cancel-project");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        console.log("Cancel button clicked");
        this.closeProjectModal();
      });
    }

    // Project form submission
    const projectForm = document.getElementById(
      "project-form"
    ) as HTMLFormElement;
    if (projectForm) {
      projectForm.addEventListener("submit", (e) => {
        console.log("Project form submitted");
        this.handleProjectSubmit(e);
      });
    }

    // Logout button
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Logout button clicked");
        this.logout();
      });
    }

    // Navigation links
    const navLinks = document.querySelectorAll(".sidebar-nav a");
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => this.handleNavigation(e));
    });

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      const modal = document.getElementById("project-modal");
      if (e.target === modal) {
        this.closeProjectModal();
      }
    });

    console.log("Event listeners setup completed");
  }

  private handleNavigation(e: Event): void {
    e.preventDefault();
    const target = e.target as HTMLAnchorElement;
    const href = target.getAttribute("href");

    console.log("Navigation clicked:", href);

    if (!href || href === "#") return;

    // Remove active class from all nav items
    document
      .querySelectorAll(".sidebar-nav li")
      .forEach((li) => li.classList.remove("active"));

    // Add active class to clicked item
    const parentLi = target.closest("li");
    parentLi?.classList.add("active");

    // Show corresponding section
    if (href === "#projects") {
      this.showSection("projects-section");
    } else if (href === "#users") {
      this.showSection("users-section");
    } else if (href === "admin-dashboard.html") {
      this.showSection("stats-cards");
    }
  }

  private showSection(sectionClass: string): void {
    console.log("Showing section:", sectionClass);

    // Hide all sections
    document
      .querySelectorAll(".stats-cards, .projects-section, .users-section")
      .forEach((section) => ((section as HTMLElement).style.display = "none"));

    // Show selected section
    const section = document.querySelector(`.${sectionClass}`) as HTMLElement;
    if (section) {
      section.style.display = "block";
    } else {
      console.error("Section not found:", sectionClass);
    }
  }

  private openProjectModal(projectId?: string): void {
    console.log("Opening project modal, projectId:", projectId);

    const modal = document.getElementById("project-modal");
    const form = document.getElementById("project-form") as HTMLFormElement;
    const title = document.querySelector(".modal-header h2");

    if (!modal || !form || !title) {
      console.error("Modal elements not found");
      return;
    }

    if (projectId) {
      title.textContent = "Edit Project";
      this.loadProjectForEdit(projectId);
    } else {
      title.textContent = "Add New Project";
      form.reset();
      // Clear any previous error messages
      const errorElement = document.getElementById("project-error");
      if (errorElement) {
        errorElement.style.display = "none";
      }
    }

    modal.style.display = "block";
    modal.setAttribute("data-project-id", projectId || "");
  }

  private async loadProjectForEdit(projectId: string): Promise<void> {
    try {
      console.log("Loading project for edit:", projectId);

      const response = await this.authFetch<ApiResponse<Project>>(
        `/projects/${projectId}`
      );
      const project = response.data;

      if (!project) {
        console.error("Project not found");
        return;
      }

      // Populate form fields
      (document.getElementById("project-name") as HTMLInputElement).value =
        project.name;
      (
        document.getElementById("project-description") as HTMLTextAreaElement
      ).value = project.description;
      (document.getElementById("project-end-date") as HTMLInputElement).value =
        project.endDate.split("T")[0];
      (
        document.getElementById("project-assigned-user") as HTMLSelectElement
      ).value = project.assignedUser?.id || "";
    } catch (error) {
      console.error("Error loading project for edit:", error);
      this.showProjectError("Failed to load project details");
    }
  }

  private closeProjectModal(): void {
    console.log("Closing project modal");

    const modal = document.getElementById("project-modal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  private async handleProjectSubmit(e: Event): Promise<void> {
    e.preventDefault();
    console.log("Handling project submit");

    const modal = document.getElementById("project-modal");
    const projectId = modal?.getAttribute("data-project-id");

    const projectData = {
      name: (document.getElementById("project-name") as HTMLInputElement).value,
      description: (
        document.getElementById("project-description") as HTMLTextAreaElement
      ).value,
      endDate: (document.getElementById("project-end-date") as HTMLInputElement)
        .value,
    };

    const assignedUserId = (
      document.getElementById("project-assigned-user") as HTMLSelectElement
    ).value;

    console.log("Project data:", projectData);
    console.log("Assigned user ID:", assignedUserId);

    if (!projectData.name.trim()) {
      this.showProjectError("Project name is required");
      return;
    }

    if (!projectData.description.trim()) {
      this.showProjectError("Project description is required");
      return;
    }

    if (!projectData.endDate) {
      this.showProjectError("End date is required");
      return;
    }

    // if(!projectData.assignedUserId){
    //   this.showProjectError('Project should be assigned')
    //   return
    // }

    try {
      let response: Project;

      if (projectId) {
        console.log("Updating project:", projectId);
        response = await this.authFetch<Project>(`/projects/${projectId}`, {
          method: "PUT",
          body: JSON.stringify(projectData),
        });
      } else {
        console.log("Creating new project");
        response = await this.authFetch<Project>("/projects", {
          method: "POST",
          body: JSON.stringify({ status: "IN_PROGRESS", ...projectData }),
        });
      }

      // Assign user to project if selected
      if (assignedUserId && response) {
        console.log("Assigning user to project");
        await this.authFetch(
          `/projects/${response.id}/assign/${assignedUserId}`,
          {
            method: "POST",
          }
        );
      }

      this.closeProjectModal();
      await this.loadDashboard(); // Refresh dashboard
      this.showSuccess(
        projectId
          ? "Project updated successfully"
          : "Project created successfully"
      );
    } catch (error) {
      console.error("Error saving project:", error);
      this.showProjectError(
        "Failed to save project: " + (error as Error).message
      );
    }
  }

  // Public methods for HTML onclick handlers
  public async editProject(projectId: string): Promise<void> {
    console.log("Edit project called:", projectId);
    this.openProjectModal(projectId);
  }

  public async completeProject(projectId: string): Promise<void> {
    console.log("Complete project called:", projectId);

    if (!confirm("Are you sure you want to mark this project as completed?")) {
      return;
    }

    try {
      await this.authFetch(`/projects/${projectId}/complete`, {
        method: "POST",
      });

      await this.loadDashboard();
      this.showSuccess("Project marked as completed");
    } catch (error) {
      console.error("Error completing project:", error);
      this.showError("Failed to complete project: " + (error as Error).message);
    }
  }

  public async deleteProject(projectId: string): Promise<void> {
    console.log("Delete project called:", projectId);

    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await this.authFetch(`/projects/${projectId}`, {
        method: "DELETE",
      });

      await this.loadDashboard();
      this.showSuccess("Project deleted successfully");
    } catch (error) {
      console.error("Error deleting project:", error);
      this.showError("Failed to delete project: " + (error as Error).message);
    }
  }

  private logout(): void {
    console.log("Logging out");
    localStorage.removeItem("authToken");
    window.location.href = "../pages/login.html";
  }

  private updateElement(id: string, content: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = content;
    } else {
      console.error("Element not found:", id);
    }
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return dateString;
    }
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private showError(message: string): void {
    console.error("Error:", message);
    alert(`Error: ${message}`);
  }

  private showSuccess(message: string): void {
    console.log("Success:", message);
    alert(`Success: ${message}`);
  }

  private showProjectError(message: string): void {
    const errorElement = document.getElementById("project-error");
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    } else {
      this.showError(message);
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing AdminDashboard");

  // Make adminDashboard globally accessible for onclick handlers
  (window as any).adminDashboard = new AdminDashboard();

  console.log("AdminDashboard attached to window");
});
