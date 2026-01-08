/* =========================================================
   Staff Dashboard (Integrated)
   ========================================================= */
const API_URL = "http://localhost:8080/api";
const token = localStorage.getItem("jwt_token");

if (!token) window.location.href = "../auth/index.html";

document.getElementById("staffName").textContent = "Staff Member";
document.getElementById("year").textContent = new Date().getFullYear();

let jobs = [];

// === FETCH JOBS ===
async function fetchJobs() {
  try {
    const res = await fetch(`${API_URL}/complaints/my-assigned`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    jobs = await res.json();

    refreshKPIs();
    renderTasks();
  } catch (error) {
    console.error("Error fetching jobs:", error);
  }
}
fetchJobs();

function refreshKPIs() {
  const assigned = jobs.filter((j) => j.status === "IN_PROGRESS").length;
  const completed = jobs.filter((j) => j.status === "RESOLVED").length;
  document.getElementById("kpiAssigned").textContent = assigned;
  document.getElementById("kpiCompleted").textContent = completed;
}

function renderTasks() {
  const el = document.getElementById("taskList");
  if (!el) return;

  el.innerHTML = jobs
    .map(
      (j) => `
    <li class="task">
      <div>
        <p class="title">${j.category} - Room ${j.roomNumber}</p>
        <p class="meta">${j.description}</p>
      </div>
      ${
        j.status === "IN_PROGRESS"
          ? `<button class="action-btn" onclick="markResolved(${j.id})">Mark Resolved</button>`
          : `<span style="color:green">Done</span>`
      }
    </li>
  `
    )
    .join("");
}

window.markResolved = async (id) => {
  if (!confirm("Mark as Resolved?")) return;
  try {
    const res = await fetch(`${API_URL}/complaints/${id}/resolve`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      alert("Resolved!");
      fetchJobs();
    }
  } catch (err) {
    console.error(err);
  }
};

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("jwt_token");
  window.location.href = "../auth/index.html";
});
