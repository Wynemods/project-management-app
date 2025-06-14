interface UserProfile {
  name: string;
  email: string;
  joinDate: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  status: string;
}

async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch("/api/user/profile", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

async function fetchUserProjects(): Promise<Project[]> {
  const res = await fetch("/api/user/projects", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

async function markProjectCompleted(id: number): Promise<void> {
  const res = await fetch(`/api/project/${id}/complete`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to complete project");
}

document.addEventListener("DOMContentLoaded", async () => {
  const nameEl = document.getElementById("current-user-name");
  const emailEl = document.getElementById("profile-email");
  const joinDateEl = document.getElementById("profile-date");
  const profileNameEl = document.getElementById("profile-name");
  const projectContainer = document.getElementById("project-container");
  const noProjectMessage = document.getElementById("no-project-message");

  const logoutBtn = document.getElementById("logout-btn");
  const completionModal = document.getElementById("completion-modal") as HTMLElement;
  const confirmBtn = document.getElementById("confirm-completion");
  const cancelBtn = document.getElementById("cancel-completion");
  const closeBtn = document.querySelector(".close-btn") as HTMLElement;

  let selectedProjectId: number | null = null;

  try {
    const profile = await fetchProfile();
    nameEl!.textContent = profile.name;
    profileNameEl!.textContent = profile.name;
    emailEl!.textContent = profile.email;
    joinDateEl!.textContent = profile.joinDate;
  } catch (err) {
    alert("Could not load profile.");
  }

  try {
    const projects = await fetchProjects();
    if (projects.length === 0) {
      noProjectMessage!.style.display = "block";
    } else {
      projects.forEach((project) => {
        const card = document.createElement("div");
        card.className = "project-card";
        card.innerHTML = `
          <h3>${project.title}</h3>
          <p>${project.description}</p>
          <p>Status: <strong>${project.status}</strong></p>
          <button class="btn btn-primary" data-id="${project.id}">Mark as Completed</button>
        `;
        projectContainer?.appendChild(card);
      });
    }
  } catch (err) {
    alert("Could not load projects.");
  }

  projectContainer?.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "BUTTON" && target.dataset.id) {
      selectedProjectId = parseInt(target.dataset.id);
      completionModal.classList.add("show");
    }
  });

  closeBtn?.addEventListener("click", () => completionModal.classList.remove("show"));
  cancelBtn?.addEventListener("click", () => completionModal.classList.remove("show"));
  confirmBtn?.addEventListener("click", async () => {
    if (selectedProjectId !== null) {
      try {
        await markProjectCompleted(selectedProjectId);
        alert("Project marked as completed!");
        location.reload();
      } catch {
        alert("Error completing project.");
      }
    }
    completionModal.classList.remove("show");
  });

  logoutBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    await fetch("/api/user/logout", { method: "POST", credentials: "include" });
    window.location.href = "login.html";
  });
});
