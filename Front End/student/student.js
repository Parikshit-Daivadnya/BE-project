/* ===========================================================
   Student Dashboard (Integrated)
   =========================================================== */

const API_URL = "http://localhost:8080/api";
const token = localStorage.getItem("jwt_token");

// GATEKEEPER: Redirect if not logged in
if (!token) {
  alert("Please login first.");
  window.location.href = "../auth/index.html";
}

// === BASIC DASHBOARD SETUP ===
const name = localStorage.getItem("student_name") || "Student";
document.getElementById("studentName").textContent = name;
document.getElementById("year").textContent = new Date().getFullYear();

// Notices (Static for now as backend doesn't have Notice Controller)
const notices = [
  {
    date: "10/11/2025",
    title: "Water supply maintenance",
    by: "Warden • Block B",
    desc: "Water off 2–4 PM.",
  },
  {
    date: "09/11/2025",
    title: "Common room cleaning",
    by: "Warden • Block A",
    desc: "Clear personal items.",
  },
];
const noticeList = document.getElementById("noticeList");
if (noticeList) {
  noticeList.innerHTML = notices
    .map(
      (n) => `
      <li class="notice">
        <span class="date">${n.date}</span>
        <div><p class="title">${n.title}</p><p class="meta">${n.by} — ${n.desc}</p></div>
      </li>
    `
    )
    .join("");
}

// === FETCH DATA & UPDATE KPIs ===
async function refreshDashboard() {
  try {
    const res = await fetch(`${API_URL}/complaints/my-complaints`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const myComplaints = await res.json();

    // Update KPIs
    const pending = myComplaints.filter(
      (c) => c.status === "RAISED" || c.status === "IN_PROGRESS"
    ).length;
    const resolved = myComplaints.filter(
      (c) => c.status === "RESOLVED" || c.status === "CLOSED"
    ).length;

    document.getElementById("kpiPending").textContent = pending;
    document.getElementById("kpiResolved").textContent = resolved;

    // Update Recent Activity (Last 3 complaints)
    const activityList = document.getElementById("activityList");
    if (activityList) {
      activityList.innerHTML = myComplaints
        .slice(-3)
        .reverse()
        .map(
          (c) =>
            `<li><span>Raised: ${c.category} - ${c.description.substring(
              0,
              20
            )}...</span><span>${c.status}</span></li>`
        )
        .join("");
    }

    // Store for modal use
    window.myComplaintsData = myComplaints;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}
refreshDashboard(); // Run on load

// === BUTTONS ===
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("jwt_token");
  window.location.href = "../auth/index.html";
});

// Quick Links
document.querySelectorAll(".ql-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.open;
    if (target === "raiseComplaint") openComplaintModal();
    else if (target === "myComplaints") openComplaintsModal();
    else if (target === "resaleMarket") openResaleModal();
    else if (target === "profile") openProfileModal();
  });
});

// ======================= LODGE COMPLAINT MODAL =======================
const lcModal = document.getElementById("complaintModal");
const lcForm = document.getElementById("lcForm");

function openComplaintModal() {
  lcModal.classList.add("open");
  document.body.classList.add("modal-open");
}
function closeComplaintModal() {
  lcModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}
document
  .getElementById("lcClose")
  ?.addEventListener("click", closeComplaintModal);

// HANDLE SUBMIT (REAL API CALL)
lcForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    category: document.getElementById("lcType").value,
    description: document.getElementById("lcDesc").value,
    // Note: Room Number comes from User profile in backend, but if your DTO needs it:
    // roomNumber: "From Profile"
  };

  try {
    const response = await fetch(`${API_URL}/complaints`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert("Complaint Raised Successfully!");
      lcForm.reset();
      closeComplaintModal();
      refreshDashboard(); // Refresh UI
    } else {
      const err = await response.text();
      alert("Failed: " + err);
    }
  } catch (error) {
    console.error(error);
    alert("Server Error");
  }
});

// ======================= MY COMPLAINTS MODAL =======================
const mcModal = document.getElementById("complaintsModal");
const mcBody = document.getElementById("complaintsBody");
const mcFilter = document.getElementById("mcFilter");

function openComplaintsModal() {
  mcModal.classList.add("open");
  document.body.classList.add("modal-open");
  renderComplaints(mcFilter.value || "all");
}
function closeComplaintsModal() {
  mcModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}
document
  .getElementById("mcClose")
  ?.addEventListener("click", closeComplaintsModal);

function renderComplaints(filter = "all") {
  const list = window.myComplaintsData || [];

  // Mapping backend status to filter keys
  const filtered = list.filter((c) => {
    if (filter === "all") return true;
    if (filter === "pending") return c.status === "RAISED";
    if (filter === "progress") return c.status === "IN_PROGRESS";
    if (filter === "resolved")
      return c.status === "RESOLVED" || c.status === "CLOSED";
    return true;
  });

  mcBody.innerHTML = filtered
    .map(
      (c) => `
    <tr>
      <td>${c.id}</td>
      <td>${c.category}</td>
      <td>${c.description}</td>
      <td>${new Date(c.createdAt).toLocaleDateString()}</td>
      <td>-</td>
      <td><span class="status-chip status-${c.status.toLowerCase()}">${
        c.status
      }</span></td>
      <td>
        ${
          c.status === "RESOLVED"
            ? `<button class="action-btn" onclick="submitFeedback('${c.id}')">Submit Feedback</button>`
            : `<button class="action-btn" onclick="verifyChain('${c.id}')">Verify</button>`
        }
      </td>
    </tr>
  `
    )
    .join("");
}

// Filter Change
mcFilter.addEventListener("change", () => renderComplaints(mcFilter.value));

// Verify Blockchain Function
window.verifyChain = async (id) => {
  try {
    const res = await fetch(`${API_URL}/blockchain/verify/${id}`);
    const msg = await res.text();
    alert(msg);
  } catch (e) {
    alert("Verification failed");
  }
};

// Submit Feedback Function
window.submitFeedback = async (id) => {
  const rating = prompt("Rate 1-5:");
  const feedback = prompt("Comments:");
  if (!rating) return;

  try {
    const res = await fetch(`${API_URL}/complaints/${id}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rating: parseInt(rating), feedback: feedback }),
    });
    if (res.ok) {
      alert("Feedback Submitted. Complaint Closed.");
      refreshDashboard();
      closeComplaintsModal();
    }
  } catch (e) {
    console.error(e);
  }
};

// ======================= RESALE & PROFILE (KEEP DEMO) =======================
// (Keep your existing Resale and Profile code below exactly as it was in your original file
//  OR copy the modal logic provided in previous steps.
//  For brevity, I assume the Modal Logic for Resale/Profile remains static.)
// ... [Insert Resale/Profile Logic here] ...
// ======================= Resale Items Modal end ===========================

// ======================= Profile Modal ===========================
const profileModal = document.getElementById("profileModal");
const pfClose = document.getElementById("pfClose");
const pfForm = document.getElementById("pfForm");

// left panel elements
const pfNameLeft = document.getElementById("pfNameLeft");
const pfPhoto = document.getElementById("pfPhoto");
const pfPhotoFallback = document.getElementById("pfPhotoFallback");
const pfPhotoInput = document.getElementById("pfPhotoInput");
const pfChangePhoto = document.getElementById("pfChangePhoto");
const pfMiniMeta = document.getElementById("pfMiniMeta");

// form fields
const pfFullName = document.getElementById("pfFullName");
const pfEmail = document.getElementById("pfEmail");
const pfPhone = document.getElementById("pfPhone");
const pfAddress = document.getElementById("pfAddress");
const pfEmergName = document.getElementById("pfEmergName");
const pfEmergPhone = document.getElementById("pfEmergPhone");
const pfBlood = document.getElementById("pfBlood");
const pfMedical = document.getElementById("pfMedical");
const pfRoll = document.getElementById("pfRoll");
const pfCourseYear = document.getElementById("pfCourseYear");
const pfVehicle = document.getElementById("pfVehicle");
const pfHobbies = document.getElementById("pfHobbies");
const pfFood = document.getElementById("pfFood");
const pfAbout = document.getElementById("pfAbout");

// tabs
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

// demo prefill (later: fetch from API)
function prefillProfile() {
  const nm = localStorage.getItem("student_name") || "Student Name";
  pfNameLeft.textContent = nm;
  pfFullName.value = nm;

  pfEmail.value = localStorage.getItem("student_email") || "name@iiitpune.edu";
  pfRoll.value = localStorage.getItem("student_roll") || "BIA27-0001";
  pfMiniMeta.innerHTML = `PRN: ${pfRoll.value}`;

  // other fields can be kept as-is (empty) for now
}

function openProfileModal() {
  prefillProfile();
  profileModal.classList.add("open");
  document.body.classList.add("modal-open");
}
function closeProfileModal() {
  profileModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}

// close handlers
pfClose.addEventListener("click", closeProfileModal);
profileModal.addEventListener("click", (e) => {
  if (e.target === profileModal) closeProfileModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && profileModal.classList.contains("open"))
    closeProfileModal();
});

// change photo (preview only)
pfChangePhoto.addEventListener("click", () => pfPhotoInput.click());
pfPhotoInput.addEventListener("change", () => {
  const file = pfPhotoInput.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  pfPhoto.src = url;
  pfPhoto.style.display = "block";
  pfPhotoFallback.style.display = "none";
});

// tabs switching
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    tabButtons.forEach((b) => b.classList.toggle("active", b === btn));
    tabPanels.forEach((p) =>
      p.classList.toggle("active", p.id === `tab-${tab}`)
    );
  });
});

// save (demo only)
pfForm.addEventListener("submit", (e) => {
  e.preventDefault();
  // collect data if needed
  const payload = {
    fullName: pfFullName.value.trim(),
    phone: pfPhone.value.trim(),
    address: pfAddress.value.trim(),
    emergName: pfEmergName.value.trim(),
    emergPhone: pfEmergPhone.value.trim(),
    blood: pfBlood.value,
    medical: pfMedical.value.trim(),
    roll: pfRoll.value,
    courseYear: pfCourseYear.value.trim(),
    vehicle: pfVehicle.value.trim(),
    hobbies: pfHobbies.value.trim(),
    food: pfFood.value,
    about: pfAbout.value.trim(),
  };
  alert("Profile saved (demo):\n" + JSON.stringify(payload, null, 2));
});

// ======================= Profile Modal end ===========================
