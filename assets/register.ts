

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
  } else {
    // Hide preview if no file selected
    profilePreviewContainer.style.display = "none";
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

// Form validation function to match backend requirements
function validateForm(userName: string, email: string, password: string, confirmPassword: string): string | null {
  // Name validation
  if (!userName || typeof userName !== 'string') {
    return "Name is required and must be a string";
  }
  
  const trimmedName = userName.trim();
  if (trimmedName.length < 2) {
    return "Name must be at least 2 characters long";
  }
  
  if (trimmedName.length > 50) {
    return "Name must not exceed 50 characters";
  }
  
  // Email validation
  if (!email || typeof email !== 'string') {
    return "Email is required";
  }
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return "Please provide a valid email address";
  }
  
  // Password validation
  if (!password || typeof password !== 'string') {
    return "Password must be a string";
  }
  
  if (password.length < 8) {
    return "Password must be longer than or equal to 8 characters";
  }
  
  if (password.length > 128) {
    return "Password must be shorter than or equal to 128 characters";
  }
  
  // Password complexity validation
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
    return "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character";
  }
  
  if (password !== confirmPassword) {
    return "Passwords do not match";
  }
  
  return null;
}

// Form submit logic
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get form values
  const userName = (document.getElementById("userName") as HTMLInputElement).value;
  const email = (document.getElementById("email") as HTMLInputElement).value;
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Validate form
  const validationError = validateForm(userName, email, password, confirmPassword);
  if (validationError) {
    alert(validationError);
    return;
  }

  // UI feedback
  registerBtn.disabled = true;
  btnLoader.style.display = "inline-block";

  try {
    // Check if profile picture is selected to determine the approach
    let response;
    
    if (profilePicInput.files?.[0]) {
      // Use FormData if profile picture is selected
      console.log("Using FormData approach (profile picture selected)");
      
      const formData = new FormData();
      formData.append("name", userName.trim()); 
      formData.append("email", email.trim());
      formData.append("password", password);
      formData.append("role", "USER"); 
      formData.append("profilePic", profilePicInput.files[0]);

      response = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        body: formData,
      });
    } else {
      // Use JSON approach if no profile picture (matching your API spec)
      const jsonPayload = {
        name: userName.trim(), 
        email: email.trim(),
        password: password,
        role: "USER" // Add default role
      };

      console.log("Using JSON approach (no profile picture):", jsonPayload);

      response = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonPayload),
      });
    }

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    let result;
    
    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    } else {
      // If not JSON, get text response for debugging
      const textResponse = await response.text();
      console.error("Non-JSON response:", textResponse);
      
      // Try to parse as JSON anyway in case content-type header is missing
      try {
        result = JSON.parse(textResponse);
      } catch {
        throw new Error(`Server returned non-JSON response: ${textResponse}`);
      }
    }

    console.log("Server response:", result);

    if (response.ok) {
      alert("Registration successful!");
      // Clear form
      registerForm.reset();
      profilePreviewContainer.style.display = "none";
      // Redirect to login
      window.location.href = "./login.html";
    } else {
      // Handle validation errors from backend
      if (result.message && Array.isArray(result.message)) {
        // If backend returns array of validation errors
        const errorMessages = result.message.join('\n');
        alert(`Registration failed:\n\n${errorMessages}`);
      } else if (result.error) {
        alert(`Registration failed: ${result.error}`);
      } else if (result.message) {
        alert(`Registration failed: ${result.message}`);
      } else {
        alert(`Registration failed with status ${response.status}`);
      }
    }
  } catch (error) {
    console.error("Registration error:", error);
    
    // More specific error messages
    if (error instanceof TypeError && error.message.includes("fetch")) {
      alert("Cannot connect to server. Please check if the server is running on http://localhost:3000");
    } else {
      if (error && typeof error === "object" && "message" in error) {
        alert(`An error occurred during registration: ${(error as { message: string }).message || 'Please try again.'}`);
      } else {
        alert("An error occurred during registration: Please try again.");
      }
    }
  } finally {
    registerBtn.disabled = false;
    btnLoader.style.display = "none";
  }
});