// login.ts

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm") as HTMLFormElement | null;
  const loginBtn = document.getElementById("loginBtn") as HTMLButtonElement | null;
  const btnLoader = document.getElementById("btnLoader") as HTMLElement | null;
  const togglePassword = document.getElementById("togglePassword") as HTMLButtonElement | null;
  const passwordInput = document.getElementById("password") as HTMLInputElement | null;

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const type = passwordInput.type === "password" ? "text" : "password";
      passwordInput.type = type;
      togglePassword.innerHTML =
        type === "password"
          ? '<i class="fas fa-eye"></i>'
          : '<i class="fas fa-eye-slash"></i>';
    });
  }

  if (loginForm && loginBtn && btnLoader) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      loginBtn.disabled = true;
      btnLoader.style.display = "inline-block";

      const emailInput = document.getElementById("email") as HTMLInputElement | null;
      const passwordInput = document.getElementById("password") as HTMLInputElement | null;
      const rememberInput = document.getElementById("remember") as HTMLInputElement | null;

      const email = emailInput?.value.trim() || "";
      const password = passwordInput?.value || "";
      const remember = rememberInput?.checked || false;

      const payload = { email, password, remember };

      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await res.json();

        if (res.ok) {
          window.location.href = "/dashboard.html";
        } else {
          alert(result.message || "Login failed");
        }
      } catch (err) {
        console.error("Login error:", err);
        alert("Something went wrong. Please try again.");
      } finally {
        loginBtn.disabled = false;
        btnLoader.style.display = "none";
      }
    });
  }
});
