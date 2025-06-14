// register.ts

const registerForm = document.getElementById("registerForm") as HTMLFormElement;
const registerBtn = document.getElementById("registerBtn") as HTMLButtonElement;
const btnLoader = document.getElementById("btnLoader") as HTMLElement;
const profilePicInput = document.getElementById("profilePic") as HTMLInputElement;
const profilePreview = document.getElementById("profilePreview") as HTMLImageElement;
const profilePreviewContainer = document.getElementById("profilePreviewContainer") as HTMLElement;

const togglePassword = document.getElementById("togglePassword") as HTMLButtonElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;

const toggleConfirmPassword = document.getElementById("toggleConfirmPassword") as HTMLButtonElement;
const confirmPasswordInput = document.getElementById("confirmPassword") as HTMLInputElement;

// Image preview logic
profilePicInput.addEventListener("change", () => {
  const file = profilePicInput.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      profilePreview.src = reader.result as string;
      profilePreviewContainer.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
});

// Toggle password visibility
togglePassword.addEventListener("click", () => {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;
  togglePassword.innerHTML =
    type === "password"
      ? '<i class="fas fa-eye"></i>'
      : '<i class="fas fa-eye-slash"></i>';
});

toggleConfirmPassword.addEventListener("click", () => {
  const type = confirmPasswordInput.type === "password" ? "text" : "password";
  confirmPasswordInput.type = type;
  toggleConfirmPassword.innerHTML =
    type === "password"
      ? '<i class="fas fa-eye"></i>'
      : '<i class="fas fa-eye-slash"></i>';
});

// Form submit logic
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // UI feedback
  registerBtn.disabled = true;
  btnLoader.style.display = "inline-block";

  const formData = new FormData();
  formData.append("userName", (document.getElementById("userName") as HTMLInputElement).value);
  formData.append("email", (document.getElementById("email") as HTMLInputElement).value);
  formData.append("password", passwordInput.value);
  formData.append("confirmPassword", confirmPasswordInput.value);
  if (profilePicInput.files?.[0]) {
    formData.append("profilePic", profilePicInput.files[0]);
  }

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      alert("Registration successful!");
      window.location.href = "login.html";
    } else {
      alert(result.message || "Registration failed");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred. Please try again.");
  } finally {
    registerBtn.disabled = false;
    btnLoader.style.display = "none";
  }
});
