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
