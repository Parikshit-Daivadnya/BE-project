/* =========================================================
   Auth Logic: Login, Register, Forgot Password
   ========================================================= */

const API_URL = "http://localhost:8080/api/users";

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

// --- ROLE FIELD TOGGLING (FIXED) ---
const sections = {
  student: document.getElementById("studentFields"),
  staff: document.getElementById("staffFields"),
  warden: document.getElementById("wardenFields"),
  admin: document.getElementById("adminFields"),
};

function toggleRoleFields(role) {
  // 1. Hide ALL sections and remove 'required' from their inputs
  for (const key in sections) {
    if (sections[key]) {
      sections[key].classList.add("hidden");

      // Find all inputs/selects inside this section and remove required
      const inputs = sections[key].querySelectorAll("input, select, textarea");
      inputs.forEach((input) => input.removeAttribute("required"));
    }
  }

  // 2. Show ONLY the selected section and add 'required' back
  if (sections[role]) {
    sections[role].classList.remove("hidden");

    // Find all inputs inside the active section and make them required
    const inputs = sections[role].querySelectorAll("input, select, textarea");
    inputs.forEach((input) => input.setAttribute("required", "true"));
  }
}

// Initialize on load and change
if (roleSelect) {
  roleSelect.addEventListener("change", (e) =>
    toggleRoleFields(e.target.value.toLowerCase())
  );
  // Run once on page load to set correct state
  toggleRoleFields(roleSelect.value.toLowerCase());
}

// --- HELPER: DECODE JWT TOKEN ---
function parseJwt(token) {
  try {
    var base64Url = token.split(".")[1];
    var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    var jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
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
      localStorage.setItem("jwt_token", data.token);

      const decoded = parseJwt(data.token);
      const roles = decoded.roles || [];

      if (roles.includes("ROLE_STUDENT"))
        window.location.href = "../student/student.html";
      else if (roles.includes("ROLE_STAFF"))
        window.location.href = "../staff/staff.html";
      else if (roles.includes("ROLE_WARDEN"))
        window.location.href = "../warden/warden.html";
      else if (roles.includes("ROLE_ADMIN"))
        window.location.href = "../admin/dashboard.html";
      else alert("Role not recognized!");
    } else {
      alert("Login failed! Invalid User ID or Password.");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Backend not reachable. Is Spring Boot running?");
  }
});

// ============================================================
// 2. REGISTRATION HANDLER
// ============================================================
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // --- Collect Common Fields ---
  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const permanentAddress = document
    .getElementById("permanentAddress")
    .value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const role = document.getElementById("role").value.toUpperCase();

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  // Base Payload
  const payload = {
    name: fullName,
    email: email,
    password: password,
    role: role,
    mobile: mobile,
    permanentAddress: permanentAddress,
  };

  // --- Collect Role-Specific Fields ---
  if (role === "STUDENT") {
    const prn = document.getElementById("studentPRN").value.trim();
    const hostel = document.getElementById("studentHostel").value.trim();
    const room = document.getElementById("studentRoom").value.trim();
    const course = document.getElementById("studentCourse").value;
    const year = document.getElementById("studentYear").value;
    const dept = document.getElementById("studentDept").value;
    const parentMobile = document.getElementById("parentMobile").value.trim();

    payload.irn = prn;
    payload.hostelName = hostel;
    payload.roomNumber = room;
    payload.course = course;
    payload.year = year;
    payload.department = dept;
    payload.parentMobile = parentMobile;
  } else if (role === "STAFF") {
    const staffCategory = document.getElementById("staffCategory").value;
    payload.staffCategory = staffCategory;
  }

  // --- Send to Backend ---
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const savedUser = await response.json();
      let msg = "Registration Successful!\n";

      if (role !== "STUDENT") {
        msg += `Your Login ID is: ${savedUser.userId}\n`;
        msg += `Please write this down!`;
      } else {
        msg += `Please Login with your PRN.`;
      }

      alert(msg);
      window.location.href = "index.html";
    } else {
      const errorText = await response.text();
      alert("Registration Failed: " + errorText);
    }
  } catch (error) {
    console.error(error);
    alert("Server error occurred during registration.");
  }
});
