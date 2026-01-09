/* =========================================================
   Warden Dashboard (Integrated)
   ========================================================= */
const API_URL = "http://localhost:8080/api";
const token = localStorage.getItem("jwt_token");

if (!token) window.location.href = "../auth/index.html";

document.getElementById("wardenName").textContent = "Warden";
document.getElementById("year").textContent = new Date().getFullYear();

let complaints = [];

// === FETCH DATA ===
async function fetchAllData() {
  try {
    const res = await fetch(`${API_URL}/complaints`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    complaints = await res.json();

    refreshKPIs();
    renderComplaintsTable();
  } catch (error) {
    console.error("Error loading complaints:", error);
  }
}
fetchAllData();

function refreshKPIs() {
  document.getElementById("kpiNew").textContent = complaints.filter(
    (c) => c.status === "RAISED"
  ).length;
  document.getElementById("kpiProgress").textContent = complaints.filter(
    (c) => c.status === "IN_PROGRESS"
  ).length;
  document.getElementById("kpiResolved").textContent = complaints.filter(
    (c) => c.status === "RESOLVED"
  ).length;
}

// === COMPLAINTS TABLE ===
function renderComplaintsTable() {
  const tbody = document.getElementById("complaintsBody");
  if (!tbody) return;

  tbody.innerHTML = complaints
    .map(
      (c) => `
      <tr>
        <td>${c.id}</td>
        <td>${c.category}</td>
        <td>${c.description}</td>
        <td>${c.roomNumber}</td>
        <td>${c.status}</td>
        <td>
            ${
              c.status === "RAISED"
                ? `<button class="btn-primary" onclick="openAssign(${c.id})">Assign</button>`
                : c.staff
                ? c.staff.name
                : "-"
            }
        </td>
      </tr>`
    )
    .join("");
}

// === ASSIGN STAFF ===
const assignModal = document.getElementById("assignModal");
const assignForm = document.getElementById("assignForm");
const assignInput = document.getElementById("assignStaff");
let currentAssignId = null;

// Populate Staff Select (Make sure your HTML has a <select id="assignStaff">)
// Ideally fetch this list from API, hardcoding for now based on your previous request
if (assignInput && assignInput.tagName === "SELECT") {
  assignInput.innerHTML = `
        <option value="STF001">STF001 (Electrician)</option>
        <option value="STF002">STF002 (Plumber)</option>
    `;
}

window.openAssign = (id) => {
  currentAssignId = id;
  if (assignModal) assignModal.classList.add("open");
};

document
  .getElementById("assignClose")
  ?.addEventListener("click", () => assignModal.classList.remove("open"));

if (assignForm) {
  assignForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const staffId = assignInput.value;

    try {
      const res = await fetch(
        `${API_URL}/complaints/${currentAssignId}/assign`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ staffId: staffId }),
        }
      );

      if (res.ok) {
        alert("Assigned Successfully!");
        assignModal.classList.remove("open");
        fetchAllData();
      } else {
        alert("Failed to assign.");
      }
    } catch (err) {
      console.error(err);
    }
  });
}

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("jwt_token");
  window.location.href = "../auth/index.html";
});



/* ================= Warden Profile Modal (new changes) ================= */

// refs
const wpModal = document.getElementById("wardenProfileModal");
const wpClose = document.getElementById("wpClose");
const wpForm = document.getElementById("wpForm");

// left panel
const wpNameLeft = document.getElementById("wpNameLeft");
const wpMiniMeta = document.getElementById("wpMiniMeta");
const wpPhoto = document.getElementById("wpPhoto");
const wpPhotoFallback = document.getElementById("wpPhotoFallback");
const wpPhotoInput = document.getElementById("wpPhotoInput");
const wpChangePhoto = document.getElementById("wpChangePhoto");

// fields
const wpFullName = document.getElementById("wpFullName");
const wpEmail = document.getElementById("wpEmail");
const wpPhone = document.getElementById("wpPhone");
const wpEmpId = document.getElementById("wpEmpId");
const wpAbout = document.getElementById("wpAbout");
const wpNotes = document.getElementById("wpNotes");

// block pills
let selectedBlock = localStorage.getItem("warden_block") || "";
const blockButtons = document.querySelectorAll(".block-btn");

// prefill
function prefillWardenProfile() {
  wpFullName.value = localStorage.getItem("warden_name") || "";
  wpEmail.value = localStorage.getItem("warden_email") || "";
  wpPhone.value = localStorage.getItem("warden_phone") || "";
  wpEmpId.value = localStorage.getItem("warden_empid") || "";
  wpAbout.value = localStorage.getItem("warden_about") || "";
  wpNotes.value = localStorage.getItem("warden_notes") || "";

  // block pills
  selectedBlock = localStorage.getItem("warden_block") || "";
  blockButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.block === selectedBlock);
  });

  // left panel
  wpNameLeft.textContent = wpFullName.value || "Warden";
  wpMiniMeta.textContent = selectedBlock ? `Block: ${selectedBlock}` : "Block: -";
}

// open
function openWardenProfile() {
  prefillWardenProfile();
  wpModal.classList.add("open");
  document.body.classList.add("modal-open");
}

// close
function closeWardenProfile() {
  wpModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}

wpClose.addEventListener("click", closeWardenProfile);
wpModal.addEventListener("click", e => {
  if (e.target === wpModal) closeWardenProfile();
});

// block selection
blockButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    selectedBlock = btn.dataset.block;
    blockButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// photo upload
wpChangePhoto.addEventListener("click", () => wpPhotoInput.click());
wpPhotoInput.addEventListener("change", () => {
  const file = wpPhotoInput.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  wpPhoto.src = url;
  wpPhoto.style.display = "block";
  wpPhotoFallback.style.display = "none";
});

// save (LOCAL ONLY — no backend)
wpForm.addEventListener("submit", e => {
  e.preventDefault();

  localStorage.setItem("warden_name", wpFullName.value.trim());
  localStorage.setItem("warden_email", wpEmail.value.trim());
  localStorage.setItem("warden_phone", wpPhone.value.trim());
  localStorage.setItem("warden_empid", wpEmpId.value.trim());
  localStorage.setItem("warden_about", wpAbout.value.trim());
  localStorage.setItem("warden_notes", wpNotes.value.trim());
  localStorage.setItem("warden_block", selectedBlock);

  alert("Profile updated.");
  closeWardenProfile();
});

// attach to topbar icon
document.getElementById("profileBtn").addEventListener("click", openWardenProfile);

/* ================= end Warden Profile Modal ================= */
