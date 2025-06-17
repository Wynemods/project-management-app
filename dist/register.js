"use strict";
// DOM elements
const registerForm = document.getElementById("registerForm");
const registerBtn = document.getElementById("registerBtn");
const btnLoader = document.getElementById("btnLoader");
const profilePicInput = document.getElementById("profilePic");
const profilePreview = document.getElementById("profilePreview");
const profilePreviewContainer = document.getElementById("profilePreviewContainer");
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
// Utility functions
function setFormLoading(isLoading) {
    registerBtn.disabled = isLoading;
    btnLoader.style.display = isLoading ? "inline-block" : "none";
}
function showMessage(message, isError = false) {
    if (isError) {
        console.error(message);
    }
    else {
        console.log(message);
    }
    alert(message);
}
function resetForm() {
    registerForm.reset();
    profilePreviewContainer.style.display = "none";
}
// Image preview logic
profilePicInput.addEventListener("change", () => {
    const file = profilePicInput.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            profilePreview.src = reader.result;
            profilePreviewContainer.style.display = "block";
        };
        reader.readAsDataURL(file);
    }
    else {
        // Hide preview if no file selected
        profilePreviewContainer.style.display = "none";
    }
});
// Toggle password visibility
function setupPasswordToggle(toggleBtn, passwordField) {
    toggleBtn.addEventListener("click", () => {
        const type = passwordField.type === "password" ? "text" : "password";
        passwordField.type = type;
        toggleBtn.innerHTML =
            type === "password"
                ? '<i class="fas fa-eye"></i>'
                : '<i class="fas fa-eye-slash"></i>';
    });
}
setupPasswordToggle(togglePassword, passwordInput);
setupPasswordToggle(toggleConfirmPassword, confirmPasswordInput);
// Form validation function to match backend requirements
function validateForm(userName, email, password, confirmPassword) {
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
// Registration API call
async function performRegistration(userName, email, password) {
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
        response = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            body: formData,
        });
    }
    else {
        // Use JSON approach if no profile picture
        const jsonPayload = {
            name: userName.trim(),
            email: email.trim(),
            password: password,
            role: "USER"
        };
        console.log("Using JSON approach (no profile picture):", jsonPayload);
        response = await fetch('http://localhost:3000/auth/register', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(jsonPayload),
        });
    }
    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);
    // Parse response
    const contentType = response.headers.get("content-type");
    let result;
    if (contentType && contentType.includes("application/json")) {
        result = await response.json();
    }
    else {
        // If not JSON, get text response for debugging
        const textResponse = await response.text();
        console.error("Non-JSON response:", textResponse);
        // Try to parse as JSON anyway in case content-type header is missing
        try {
            result = JSON.parse(textResponse);
        }
        catch {
            throw new Error(`Server returned non-JSON response: ${textResponse}`);
        }
    }
    console.log("Server response:", result);
    if (!response.ok) {
        // Handle validation errors from backend
        let errorMessage = "Registration failed";
        if (result.message && Array.isArray(result.message)) {
            errorMessage = `Registration failed:\n\n${result.message.join('\n')}`;
        }
        else if (result.error) {
            errorMessage = `Registration failed: ${result.error}`;
        }
        else if (result.message) {
            errorMessage = `Registration failed: ${result.message}`;
        }
        else {
            errorMessage = `Registration failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
    }
    return result;
}
// Handle successful registration
function handleRegistrationSuccess() {
    showMessage("Registration successful!");
    resetForm();
    // Redirect to login
    window.location.href = "./login.html";
}
// Form submit logic
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Get form values
    const userName = document.getElementById("userName").value;
    const email = document.getElementById("email").value;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    // Validate form
    const validationError = validateForm(userName, email, password, confirmPassword);
    if (validationError) {
        showMessage(validationError, true);
        return;
    }
    // Set loading state
    setFormLoading(true);
    try {
        await performRegistration(userName, email, password);
        handleRegistrationSuccess();
    }
    catch (error) {
        console.error("Registration error:", error);
        // More specific error messages
        if (error instanceof TypeError && error.message.includes("fetch")) {
            showMessage("Cannot connect to server. Please check if the server is running on http://localhost:3000", true);
        }
        else if (error instanceof Error) {
            showMessage(error.message, true);
        }
        else {
            showMessage("An error occurred during registration. Please try again.", true);
        }
    }
    finally {
        setFormLoading(false);
    }
});
