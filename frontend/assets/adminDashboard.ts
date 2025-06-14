interface Project {
  id: number;
  name: string;
  description: string;
  endDate: string;
  assignedTo: string;
  status: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  registrationDate: string;
  assignedProject?: string;
}

async function fetchStats() {
  const res = await fetch("/api/admin/stats", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
}

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/admin/projects", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load projects");
  return res.json();
}

async function fetchUsers(): Promise<User[]> {
  const res = await fetch("/api/admin/users", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}

async function createProject(project: Partial<Project>) {
  const res = await fetch("/api/admin/projects", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error("Failed to create project");
  return res.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  const totalProjects = document.getElementById("total-projects")!;
  const activeProjects = document.getElementById("active-projects")!;
  const totalUsers = document.getElementById("total-users")!;
  const projectsTable = document.getElementById("projects-table")!.querySelector("tbody")!;
  const usersTable = document.getElementById("users-table")!.querySelector("tbody")!;
  const assignedUserSelect = document.getElementById("project-assigned-user") as HTMLSelectElement;

  const modal = document.getElementById("project-modal")!;
  const openModalBtn = document.getElementById("add-project-btn")!;
  const closeModalBtn = document.querySelector(".close-btn")!;
  const cancelBtn = document.getElementById("cancel-project")!;
  const form = document.getElementById("project-form") as HTMLFormElement;
  const errorMsg = document.getElementById("project-error")!;
  const logoutBtn = document.getElementById("logout-btn")!;

  // Load stats
  try {
    const stats = await fetchStats();
    totalProjects.textContent = stats.totalProjects.toString();
    activeProjects.textContent = stats.activeProjects.toString();
    totalUsers.textContent = stats.totalUsers.toString();
  } catch {
    alert("Failed to load dashboard statistics");
  }

  // Load users
  try {
    const users = await fetchUsers();
    usersTable.innerHTML = "";
    assignedUserSelect.innerHTML = `<option value="">Select a user</option>`;

    users.forEach((user) => {
      // Table
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.registrationDate}</td>
        <td>${user.assignedProject ?? "-"}</td>
      `;
      usersTable.appendChild(row);

      // Form select
      const opt = document.createElement("option");
      opt.value = user.id.toString();
      opt.textContent = user.name;
      assignedUserSelect.appendChild(opt);
    });
  } catch {
    alert("Failed to load users");
  }

  // Load projects
  try {
    const projects = await fetchProjects();
    projectsTable.innerHTML = "";

    projects.forEach((project) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${project.name}</td>
        <td>${project.description}</td>
        <td>${project.endDate}</td>
        <td>${project.assignedTo}</td>
        <td>${project.status}</td>
        <td>
          <!-- Optional: Add edit/delete buttons -->
          <button class="btn btn-sm">Edit</button>
        </td>
      `;
      projectsTable.appendChild(row);
    });
  } catch {
    alert("Failed to load projects");
  }

  // Open/Close modal
  openModalBtn.addEventListener("click", () => modal.classList.add("show"));
  closeModalBtn.addEventListener("click", () => modal.classList.remove("show"));
  cancelBtn.addEventListener("click", () => modal.classList.remove("show"));

  // Submit form
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.textContent = "";

    const name = (document.getElementById("project-name") as HTMLInputElement).value;
    const description = (document.getElementById("project-description") as HTMLTextAreaElement).value;
    const endDate = (document.getElementById("project-end-date") as HTMLInputElement).value;
    const assignedUser = assignedUserSelect.value;

    try {
      await createProject({
        name,
        description,
        endDate,
        assignedTo: assignedUser || undefined,
      });
      modal.classList.remove("show");
      window.location.reload();
    } catch (err) {
      errorMsg.textContent = "Failed to create project.";
    }
  });

  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    await fetch("/api/user/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login.html";
  });
});
