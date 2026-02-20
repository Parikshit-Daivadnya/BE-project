/* =========================================================
   Staff Dashboard (Final: Calendar + Performance)
   ========================================================= */
const API_URL = "http://localhost:8080/api";
const token = localStorage.getItem("jwt_token");

if (!token) window.location.href = "../auth/index.html";

// --- Helper: Decode Token ---
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}
const currentUserId = parseJwt(token).sub;

// Global Data
let jobs = [];
let notices = [];
let currentUserData = {};
let calendarState = {
  start: getWeekStart(new Date()), // Initialize with current week
};

// =========================================================
// 1. INITIAL DATA FETCH
// =========================================================
async function initDashboard() {
  try {
    // ✅ ADDED: loadPerformance()
    await Promise.all([
      loadProfile(),
      loadAssignedJobs(),
      loadNotices(),
      loadPerformance(),
    ]);

    updateHeader();
    refreshKPIs();
    renderTasks();
    renderAlerts();
    renderJobsTable();

    if (document.getElementById("calGrid")) {
      renderWeek(calendarState);
    }
  } catch (e) {
    console.error("Init failed:", e);
  }
}

async function loadProfile() {
  try {
    const res = await fetch(`${API_URL}/users/${currentUserId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) currentUserData = await res.json();
  } catch (e) {
    console.error("Profile Error", e);
  }
}

async function loadAssignedJobs() {
  try {
    const res = await fetch(`${API_URL}/complaints/my-assigned`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      // Map Backend Data
      jobs = data.map((c) => ({
        id: String(c.id),
        type: c.category,
        title: c.description,
        room: c.roomNumber,
        status: mapStatus(c.status),
        slot: c.timeSlot || "Any Time",
        date: c.createdAt,
        rating: c.rating || 0, // ✅ Capture Rating
      }));

      // Re-render Calendar with real dates
      if (document.getElementById("calGrid")) {
        renderWeek(calendarState);
      }
    }
  } catch (e) {
    console.error("Jobs Error", e);
  }
}

function mapStatus(s) {
  if (s === "RESOLVED" || s === "CLOSED") return "resolved";
  return "progress";
}

async function loadNotices() {
  try {
    const res = await fetch(`${API_URL}/notices`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) notices = await res.json();
  } catch (e) {
    console.error("Notices Error", e);
  }
}

// ✅ NEW: Load Official Performance Stats
async function loadPerformance() {
  try {
    const res = await fetch(
      `${API_URL}/complaints/stats/staff/${currentUserId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (res.ok) {
      const data = await res.json();
      const score = data.averageRating || 0.0;
      const count = data.totalRated || 0;

      // Update Modal
      const perfScore = document.getElementById("perfScore");
      const perfStars = document.getElementById("perfStars");
      const perfCount = document.getElementById("perfCount");

      if (perfScore) perfScore.textContent = score.toFixed(1);
      if (perfCount) perfCount.textContent = `(${count} reviews)`;
      if (perfStars) perfStars.textContent = getStarString(score);

      // Update Dashboard KPI Card
      const kpiRating = document.getElementById("kpiRating");
      const kpiStars = document.getElementById("kpiStars");
      if (kpiRating) kpiRating.textContent = score.toFixed(1);
      if (kpiStars) kpiStars.textContent = getStarString(score);
    }
  } catch (e) {
    console.error("Performance Load Error", e);
  }
}

function getStarString(score) {
  const full = Math.floor(score);
  const half = score % 1 >= 0.5 ? 1 : 0;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(5 - full - half);
}

function updateHeader() {
  const nameEl = document.getElementById("staffName");
  if (nameEl) nameEl.textContent = currentUserData.name || "Staff";

  const roleEl = document.getElementById("staffRole");
  if (roleEl)
    roleEl.textContent = `(Role: ${
      currentUserData.staffCategory || "General"
    })`;

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

initDashboard();

/* =========================================================
   2. CALENDAR LOGIC
   ========================================================= */
function toISODate(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    .toISOString()
    .slice(0, 10);
}

function getWeekStart(d) {
  const s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  s.setHours(0, 0, 0, 0);
  return s;
}

const calModal = document.getElementById("calModal");
const calGrid = document.getElementById("calGrid");
const calMonthTitle = document.getElementById("calMonthTitle");

function openCalModal() {
  if (calModal) {
    calModal.classList.add("open");
    renderWeek(calendarState);
  }
}

function closeCalModal() {
  if (calModal) calModal.classList.remove("open");
}

document
  .querySelector('[data-open="calendar"]')
  ?.addEventListener("click", openCalModal);
document.getElementById("calClose")?.addEventListener("click", closeCalModal);

// Navigation
document
  .getElementById("calPrev")
  ?.addEventListener("click", () => changeWeek(-7));
document
  .getElementById("calNext")
  ?.addEventListener("click", () => changeWeek(7));

function changeWeek(days) {
  const newStart = new Date(calendarState.start);
  newStart.setDate(newStart.getDate() + days);
  calendarState.start = newStart;
  renderWeek(calendarState);
}

function renderWeek(state) {
  if (!calGrid) return;

  const days = [...Array(7)].map((_, i) => {
    const d = new Date(state.start);
    d.setDate(state.start.getDate() + i);
    return d;
  });

  if (calMonthTitle) {
    const options = { month: "long", year: "numeric" };
    calMonthTitle.textContent = state.start.toLocaleDateString(
      "en-US",
      options,
    );
  }

  calGrid.innerHTML = days
    .map((d) => {
      const dayIso = toISODate(d);
      const dayEv = jobs.filter((j) => {
        const jobDate = new Date(j.date);
        return toISODate(jobDate) === dayIso;
      });

      return `
      <div class="cal-day">
        <div class="head">
            <span class="day-name">${d.toLocaleDateString("en-US", {
              weekday: "short",
            })}</span>
            <span class="day-num">${d.getDate()}</span>
        </div>
        <div class="wrap">
            ${dayEv
              .map(
                (e) =>
                  `<div class="cal-chip ev-${e.status}" title="${e.title}">
                    <span class="txt">#${e.id} Room ${e.room}</span>
                   </div>`,
              )
              .join("")}
        </div>
      </div>`;
    })
    .join("");
}

/* =========================================================
   3. DASHBOARD WIDGETS (KPIs)
   ========================================================= */
function refreshKPIs() {
  const assigned = jobs.filter((j) => j.status !== "resolved").length;
  const completed = jobs.filter((j) => j.status === "resolved").length;

  if (document.getElementById("kpiAssigned"))
    document.getElementById("kpiAssigned").textContent = assigned;

  if (document.getElementById("kpiCompleted"))
    document.getElementById("kpiCompleted").textContent = completed;
}

function renderTasks() {
  const el = document.getElementById("taskList");
  if (!el) return;

  const list = jobs.filter((j) => j.status !== "resolved");
  if (!list.length) {
    el.innerHTML = "<li>No pending tasks</li>";
    return;
  }

  el.innerHTML = list
    .map(
      (j) => `
    <li class="task">
      <div>
        <p class="title">${j.title.substring(0, 20)}...</p>
        <p class="meta">${j.type} • Room ${j.room}</p>
        <p class="meta" style="color:var(--blue); font-weight:bold;">🕒 ${
          j.slot
        }</p>
      </div>
      <button class="action-btn" onclick="openResolveFlow('${
        j.id
      }')">View</button>
    </li>
  `,
    )
    .join("");
}

function renderAlerts() {
  const el = document.getElementById("noticeList");
  if (!el) return;
  el.innerHTML = notices
    .slice(0, 3)
    .map((n) => `<li>${n.title}</li>`)
    .join("");
}

/* =========================================================
   4. JOBS TABLE & RESOLVE FLOW
   ========================================================= */
const jobsModal = document.getElementById("jobsModal");
const jobsBody = document.getElementById("jobsBody");

document.querySelector('[data-open="jobs"]')?.addEventListener("click", () => {
  if (jobsModal) {
    jobsModal.classList.add("open");
    renderJobsTable();
  }
});
document
  .getElementById("jobsClose")
  ?.addEventListener("click", () => jobsModal.classList.remove("open"));

/* =========================================================
   JOBS TABLE (With Blockchain Verification)
   ========================================================= */
function renderJobsTable() {
  if (!jobsBody) return;
  jobsBody.innerHTML = jobs
    .map((j) => {
      // 1. Define Actions
      let actionBtn = "";
      if (j.status !== "resolved") {
        actionBtn = `<button class="action-btn" onclick="openResolveFlow('${j.id}')">Resolve</button>`;
      } else {
        actionBtn = `<span class="status-chip status-resolved">Done</span>`;
      }

      // 2. Add Verify Button (The "Trust Bridge")
      const verifyBtn = `
        <button class="action-btn" 
                style="background:#2c3e50; margin-left:5px;" 
                onclick="verifyJobOnChain('${j.id}')" 
                title="Check Blockchain Record">
           ⛓️ Verify
        </button>`;

      return `
    <tr>
      <td>${j.id}</td>
      <td>${j.type}</td>
      <td>${j.title}</td>
      <td>${j.room}</td>
      <td style="color:var(--blue); font-weight:500;">${j.slot}</td>
      <td><span class="status-chip status-${j.status}">${j.status}</span></td>
      <td>
        <div style="display:flex; align-items:center; gap:5px;">
            ${actionBtn}
            ${verifyBtn}
        </div>
      </td>
    </tr>`;
    })
    .join("");
}

const resolveModal = document.getElementById("resolveModal");
const resJobId = document.getElementById("resJobId");
const resJobDisplay = document.getElementById("resJobDisplay");

window.openResolveFlow = (id) => {
  const job = jobs.find((j) => j.id == id);
  if (!job) return;

  if (resJobId) resJobId.value = job.id;
  if (resJobDisplay) resJobDisplay.value = `#${job.id} - ${job.title}`;

  if (jobsModal) jobsModal.classList.remove("open");
  if (resolveModal) resolveModal.classList.add("open");
};

document
  .getElementById("resClose")
  ?.addEventListener("click", () => resolveModal.classList.remove("open"));

document
  .getElementById("resolveForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/complaints/${resJobId.value}/resolve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Resolved!");
      resolveModal.classList.remove("open");
      await loadAssignedJobs();
      updateUI();
    } catch (e) {
      console.error(e);
    }
  });

function updateUI() {
  refreshKPIs();
  renderTasks();
  renderAlerts();
  renderJobsTable();
  loadPerformance(); // ✅ Refresh stats after resolving
  if (document.getElementById("calGrid")) renderWeek(calendarState);
}

/* =========================================================
   5. PERFORMANCE MODAL LOGIC (NEW)
   ========================================================= */
const perfModal = document.getElementById("perfModal");
const perfList = document.getElementById("perfList");

document
  .querySelector('[data-open="performance"]')
  ?.addEventListener("click", () => {
    if (perfModal) {
      perfModal.classList.add("open");
      renderPerformanceList();
    }
  });

document.getElementById("perfClose")?.addEventListener("click", () => {
  if (perfModal) perfModal.classList.remove("open");
});

function renderPerformanceList() {
  if (!perfList) return;

  // Filter jobs that are rated
  const ratedJobs = jobs.filter((j) => j.rating > 0);

  if (ratedJobs.length === 0) {
    perfList.innerHTML = `<li style="color:#888;">No rated jobs yet.</li>`;
    return;
  }

  perfList.innerHTML = ratedJobs
    .slice(0, 10) // Show last 10
    .map(
      (j) => `
      <li style="border-bottom:1px solid #eee; padding:8px 0;">
        <div style="display:flex; justify-content:space-between;">
          <strong>Job #${j.id}</strong>
          <span style="color:#f39c12;">${getStarString(j.rating)}</span>
        </div>
        <p style="margin:4px 0 0; color:#555; font-size:0.9em;">
          Room ${j.room} • ${j.title.substring(0, 30)}...
        </p>
      </li>
    `,
    )
    .join("");
}

/* =========================================================
   6. PROFILE & UTILS
   ========================================================= */
const spModal = document.getElementById("staffProfileModal");
document.getElementById("profileBtn")?.addEventListener("click", () => {
  document.getElementById("spFullName").value = currentUserData.name || "";
  document.getElementById("spEmail").value = currentUserData.email || "";
  document.getElementById("spPhone").value = currentUserData.mobile || "";
  spModal.classList.add("open");
});
document
  .getElementById("spClose")
  ?.addEventListener("click", () => spModal.classList.remove("open"));

document.getElementById("spForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await fetch(`${API_URL}/users/${currentUserId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        mobile: document.getElementById("spPhone").value,
      }),
    });
    alert("Updated!");
    spModal.classList.remove("open");
    loadProfile();
  } catch (e) {}
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("jwt_token");
  window.location.href = "../auth/index.html";
});

/* =========================================================
   BLOCKCHAIN FEATURES
   ========================================================= */

// 1. Verify Job (Read from Hyperledger Ledger)
window.verifyJobOnChain = async (id) => {
  try {
    const res = await fetch(`${API_URL}/complaints/${id}/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const chainData = await res.json();
      alert(
        `✅ BLOCKCHAIN VERIFIED!\n\n` +
          `Complaint ID: ${chainData.complaintId}\n` +
          `Student: ${chainData.studentName}\n` +
          `Status: ${chainData.status}\n\n` +
          `This record is immutable and proves you completed the job.`,
      );
    } else {
      alert("⚠️ Record not found on Blockchain (it might be an old entry).");
    }
  } catch (e) {
    alert("Verification Error: " + e.message);
  }
};

// 2. Updated Resolve Logic
// (Find the existing 'resolveForm' listener and REPLACE it with this one if you want better alerts)
document
  .getElementById("resolveForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type='submit']");
    const originalText = btn.textContent;

    btn.textContent = "Syncing to Blockchain...";
    btn.disabled = true;

    try {
      // This call triggers the Java Backend -> Which triggers Hyperledger Fabric
      await fetch(`${API_URL}/complaints/${resJobId.value}/resolve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("✅ Job Resolved!\nStatus updated on Database & Blockchain.");

      resolveModal.classList.remove("open");
      await loadAssignedJobs(); // Refresh list
      updateUI();
    } catch (e) {
      console.error(e);
      alert("Error resolving job.");
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
