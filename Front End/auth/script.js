// Tabs
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

loginTab.onclick = () => {
  loginTab.classList.add("active");
  registerTab.classList.remove("active");
  loginForm.classList.add("active");
  registerForm.classList.remove("active");
};

registerTab.onclick = () => {
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
  registerForm.classList.add("active");
  loginForm.classList.remove("active");
};

// Switch links
document.getElementById("switchToRegister").onclick = (e) => {
  e.preventDefault(); registerTab.click();
};
document.getElementById("switchToLogin").onclick = (e) => {
  e.preventDefault(); loginTab.click();
};

// Role-specific field visibility (Register)
const roleSelect = document.getElementById("role");
const studentFields = document.getElementById("studentFields");
const staffFields = document.getElementById("staffFields");
const wardenFields = document.getElementById("wardenFields");
const adminFields = document.getElementById("adminFields");

function toggleRoleFields(role) {
  studentFields.classList.toggle("hidden", role !== "student");
  staffFields.classList.toggle("hidden", role !== "staff");
  wardenFields.classList.toggle("hidden", role !== "warden");
  adminFields.classList.toggle("hidden", role !== "admin");
}
roleSelect.addEventListener("change", (e) => toggleRoleFields(e.target.value));
toggleRoleFields(roleSelect.value); // initial render

// Demo submit handlers
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Demo login for role: " + document.getElementById("loginRole").value);
});
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Form submitted for role: " + roleSelect.value + " (demo only)");
});
