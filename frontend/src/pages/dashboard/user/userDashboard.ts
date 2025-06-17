interface UserProfile {
  name: string;
  email: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}
async function authFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("authToken");

  if (!token) {
    throw new Error("No auth token found");
  }

  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function fetchProfile(): Promise<UserProfile> {
  return authFetch<UserProfile>("http://localhost:3000/users/profile");
}

async function fetchUserProjects(): Promise<Project[]> {
  return authFetch<Project[]>("http://localhost:3000/projects");
}

async function markProjectCompleted(id: string): Promise<unknown> {
  const markComplete = await authFetch<Project>(`http://localhost:3000/projects/${id}/complete`, {
    method: "POST",
  });
  

  if (markComplete.status === 'COMPLETED') {
    return await authFetch<string>(`http://localhost:3000/projects/${markComplete.assignedUser.id}/unassign-project`,{
      method: 'DELETE'
    })
  }

}


document.addEventListener("DOMContentLoaded", async () => {
  console.log('LOADING PAGE');
  
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

  let selectedProjectId: string | null = null;

  try {
    const profile = await fetchProfile();
    console.log("USER PROFILE", profile)
    document.getElementById("current-user-name")!.innerHTML = profile.name;
        document.getElementById("current-user-name")!.innerHTML = profile.name;
       document.getElementById("profile-email")!.innerHTML = profile.email;
    document.getElementById("profile-date")!.innerHTML = profile.createdAt;

  } catch (err) {
    console.error("USER PROFILE ERROR", err)
    // alert("Could not load profile.");
  }

  try {
    const projects = await fetchUserProjects();
    if (projects.length === 0) {
      noProjectMessage!.style.display = "block";
    } else {
      projects.forEach((project) => {
        const card = document.createElement("div");
        card.className = "project-card";
        card.innerHTML = `
          <h3>${project.name}</h3>
          <p>${project.description}</p>
          <p>Status: <strong>${project.status}</strong></p>
          <button class="btn btn-primary" data-id="${project.id}">Mark as Completed</button>
        `;
        projectContainer?.appendChild(card);
      });
    }
  } catch (err) {
    // alert("Could not load projects.");
    console.error("Projects Error:", err)
  }

  projectContainer?.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "BUTTON" && target.dataset.id) {
      selectedProjectId = target.dataset.id;
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
    const baseUrl = window.location.origin;
    window.location.replace(`${baseUrl}/pages/login/login.html`);
  });
});
