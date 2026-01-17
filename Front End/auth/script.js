/* =========================================================
   Auth Logic: Login, Register, Forgot Password
   ========================================================= */

// ✅ Point to the Auth Controller
const API_URL = "http://localhost:8080/api/auth";

// --- DOM ELEMENTS ---
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const roleSelect = document.getElementById("role");

// --- TABS SWITCHING LOGIC ---
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

document.getElementById("switchToRegister").onclick = (e) => {
  e.preventDefault();
  registerTab.click();
};
document.getElementById("switchToLogin").onclick = (e) => {
  e.preventDefault();
  loginTab.click();
};

// --- ROLE FIELD TOGGLING ---
const sections = {
  student: document.getElementById("studentFields"),
  staff: document.getElementById("staffFields"),
  warden: document.getElementById("wardenFields"),
  admin: document.getElementById("adminFields"),
};

function toggleRoleFields(role) {
  // 1. Hide ALL sections and remove 'required' from inputs
  for (const key in sections) {
    if (sections[key]) {
      sections[key].classList.add("hidden");
      const inputs = sections[key].querySelectorAll("input, select, textarea");
      inputs.forEach((input) => input.removeAttribute("required"));
    }
  }

  // 2. Show ONLY selected section and add 'required' back
  if (sections[role]) {
    sections[role].classList.remove("hidden");
    const inputs = sections[role].querySelectorAll("input, select, textarea");
    inputs.forEach((input) => input.setAttribute("required", "true"));
  }
}

// Initialize on load and change
if (roleSelect) {
  roleSelect.addEventListener("change", (e) =>
    toggleRoleFields(e.target.value.toLowerCase())
  );
  toggleRoleFields(roleSelect.value.toLowerCase());
}

// ============================================================
// 1. LOGIN HANDLER
// ============================================================
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userIdInput = document.getElementById("loginUserId");
  const passwordInput = document.getElementById("loginPassword");

  const payload = {
    userId: userIdInput.value.trim(),
    password: passwordInput.value,
  };

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();

      // 1. Save Token
      localStorage.setItem("jwt_token", data.token);
      localStorage.setItem("user_role", data.role);

      // 2. Redirect based on Role
      const role = data.role ? data.role.toUpperCase() : "";

      if (role === "STUDENT") {
        window.location.href = "../student/student.html";
      } else if (role === "WARDEN") {
        window.location.href = "../warden/warden.html";
      } else if (role === "STAFF") {
        window.location.href = "../staff/staff.html";
      } else if (role === "ADMIN") {
        window.location.href = "../admin/admin.html";
      } else {
        alert("Role not recognized: " + role);
      }
    } else {
      alert("Login failed! Invalid User ID or Password.");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Backend not reachable. Is Spring Boot running?");
  }
});

// ============================================================
// 2. REGISTRATION HANDLER (FIXED FILE INPUTS)
// ============================================================
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validate Passwords
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  // ✅ Use FormData
  const formData = new FormData();

  // --- Common Fields ---
  formData.append("name", document.getElementById("fullName").value.trim());
  formData.append("email", document.getElementById("email").value.trim());
  formData.append("mobile", document.getElementById("mobile").value.trim());
  formData.append(
    "permanentAddress",
    document.getElementById("permanentAddress").value.trim()
  );
  formData.append("password", password);

  const role = document.getElementById("role").value.toUpperCase();
  formData.append("role", role);

  // --- Role Specific Fields & File ID Selection ---
  let fileInputId = null;

  if (role === "STUDENT") {
    formData.append("irn", document.getElementById("studentPRN").value.trim());
    formData.append(
      "hostelName",
      document.getElementById("studentHostel").value.trim()
    );
    formData.append(
      "roomNumber",
      document.getElementById("studentRoom").value.trim()
    );
    formData.append("course", document.getElementById("studentCourse").value);
    formData.append("year", document.getElementById("studentYear").value);
    formData.append("department", document.getElementById("studentDept").value);
    formData.append(
      "parentMobile",
      document.getElementById("parentMobile").value.trim()
    );

    fileInputId = "studentIdProof"; // ✅ Matches HTML ID
  } else if (role === "STAFF") {
    formData.append(
      "staffCategory",
      document.getElementById("staffCategory").value
    );
    fileInputId = "staffIdProof"; // ✅ Matches HTML ID
  } else if (role === "WARDEN") {
    fileInputId = "wardenIdProof"; // ✅ Matches HTML ID
  }

  // --- Handle Mandatory ID Proof ---
  // We get the specific input based on the role selected above
  const fileInput = fileInputId ? document.getElementById(fileInputId) : null;

  if (fileInput && fileInput.files[0]) {
    // The backend expects the param name "idProof"
    formData.append("idProof", fileInput.files[0]);
  } else if (role !== "ADMIN") {
    // Admin might be exempt, but others must upload
    alert("Please upload your ID Proof file.");
    return;
  }

  // --- Send to Backend ---
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      body: formData, // Content-Type is auto-set
    });

    if (response.ok) {
      const savedUser = await response.json();
      let msg = "Registration Successful!\n";

      if (role !== "STUDENT") {
        msg += `Your Login ID is: ${savedUser.userId}\n`;
        msg += `Please write this down!`;
      } else {
        msg += `Please Login with your IRN.`;
      }

      alert(msg);
      window.location.reload(); // Refresh to clear form
    } else {
      const errorText = await response.text();
      alert("Registration Failed: " + errorText);
    }
  } catch (error) {
    console.error(error);
    alert("Server error occurred during registration.");
  }
});
