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
    date: "11/11/2025",
    title: "Water supply maintenance",
    by: "Warden • Block B",
    desc: "Water off 2–4 PM.",
  },
  {
    date: "10/11/2025",
    title: "Common room cleaning",
    by: "Warden • Block A",
    desc: "Clear personal items.",
  },
  {
    date: "09/11/2025",
    title: "Gym cleaning",
    by: "Warden • Block D",
    desc: "Clear personal items.",
  },
];



/* new changes for Bell icon notices */
/* ================= Notifications System ================= */

/* let notifications = [
  // Hard-coded starting notification (example)
  { message: "Welcome to DHCRC Dashboard!", type: "info", time: "Just now", read: false }
];

// Universal notification generator (backend ready)
function addNotification(message) {
  notifications.unshift({
    message,
    time: new Date().toLocaleString(),
    read: false
  });
  updateNotificationBadge();
}

/* Event-based notification helpers */

/*function notifyComplaintLodged(id) {
  addNotification(`Complaint ${id} lodged successfully.`);
}

function notifyComplaintResolved(id) {
  addNotification(`Your complaint ${id} has been resolved.`);
}

function notifyFeedbackRequired(id) {
  addNotification(`Please give feedback for complaint ${id}.`);
}

function notifyResalePosted(name) {
  addNotification(`Resale item '${name}' posted successfully.`);
}

function notifyResaleSold(name) {
  addNotification(`Your resale item '${name}' was marked sold.`);
}

function notifyNewNotice(title) {
  addNotification(`New notice posted: ${title}`);
} *

/* new changes for Bell icon notices end */
/* ================= Notifications System end ================= */



const noticeList = document.getElementById("noticeList");
if (noticeList) {
  // Latest 3 notices 
  // New Changes 
const latest = notices.slice(0, 3);

noticeList.innerHTML = latest
  .map(
    (n) => `
      <li class="notice">
        <span class="date">${n.date}</span>
        <div>
          <p class="title">${n.title}</p>
          <p class="meta">${n.by} — ${n.desc}</p>
        </div>
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

// Profile Button
// Profile icon on topbar → open profile modal (new changes)
document.getElementById("profileBtn").addEventListener("click", openProfileModal);



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


/* ======================= RESALE ITEMS (DEMO) ======================= */
//New Changes
const resaleModal = document.getElementById("resaleModal");
const rsClose = document.getElementById("rsClose");
const rsSearch = document.getElementById("rsSearch");
const rsCategory = document.getElementById("rsCategory");
const rsSort = document.getElementById("rsSort");
const rsGrid = document.getElementById("rsGrid");

// Details modal refs
const rsDetailsModal = document.getElementById("rsDetailsModal");
const rsDetClose = document.getElementById("rsDetClose");
const rsDetCloseBtn = document.getElementById("rsDetCloseBtn");
const rsDetImg = document.getElementById("rsDetImg");
const rsDetName = document.getElementById("rsDetName");
const rsDetPrice = document.getElementById("rsDetPrice");
const rsDetOwner = document.getElementById("rsDetOwner");
const rsDetDesc = document.getElementById("rsDetDesc");
const rsMarkSold = document.getElementById("rsMarkSold");

// Post Item modal refs
const postItemModal = document.getElementById("postItemModal");
const rsPostBtn = document.getElementById("rsPostBtn");
const piClose = document.getElementById("piClose");
const piForm = document.getElementById("piForm");
const piReset = document.getElementById("piReset");

// Demo Resale Items
let resaleItems = [
  { id:"RS-001", name:"Study Table", price:1200, owner:"Amit (B-203)", category:"furniture", date:"2025-11-10", img:"", desc:"Solid wood, good condition.", sold:false },
  { id:"RS-002", name:"Router TP-Link", price:800, owner:"Neha (A-108)", category:"electronics", date:"2025-11-09", img:"", desc:"Dual band router, works fine.", sold:false },
  { id:"RS-003", name:"DSA Book", price:250, owner:"Karan (C-310)", category:"books", date:"2025-11-08", img:"", desc:"Clean copy, few highlights.", sold:false },
  { id:"RS-004", name:"Chair", price:400, owner:"Priya (B-401)", category:"furniture", date:"2025-11-07", img:"", desc:"Plastic chair, barely used.", sold:false },
];

// Open / Close resale modal
function openResaleModal(){
  resaleModal.classList.add("open");
  document.body.classList.add("modal-open");
  renderResale();
}
function closeResaleModal(){
  resaleModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}
rsClose.addEventListener("click", closeResaleModal);
resaleModal.addEventListener("click", e => { if (e.target === resaleModal) closeResaleModal(); });

// Render resale grid
function renderResale(){
  const q = rsSearch.value.trim().toLowerCase();
  const cat = rsCategory.value;
  const sort = rsSort.value;

  let list = resaleItems.filter(it => !it.sold);
  if (cat !== "all") list = list.filter(it => it.category === cat);
  if (q) list = list.filter(it => it.name.toLowerCase().includes(q));

  list.sort((a,b) => {
    if (sort === "priceAsc") return a.price - b.price;
    if (sort === "priceDesc") return b.price - a.price;
    if (sort === "old") return new Date(a.date) - new Date(b.date);
    return new Date(b.date) - new Date(a.date); // newest
  });

  rsGrid.innerHTML = list.map(it => `
    <div class="rs-card">
      <div class="rs-thumb">${it.img ? `<img src="${it.img}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:12px">` : "🖼️"}</div>
      <h4 class="rs-title">${it.name}</h4>
      <p class="rs-price">₹ ${it.price}</p>
      <p class="rs-meta">Posted by ${it.owner} • ${formatDate(it.date)}</p>
      <div class="rs-actions">
        <button class="rs-view" data-id="${it.id}">View Details</button>
      </div>
    </div>
  `).join("");

  // Attach view handlers
  rsGrid.querySelectorAll(".rs-view").forEach(btn => {
    btn.addEventListener("click", () => openResaleDetails(btn.dataset.id));
  });

  // Update Resale KPI
  const resaleCount = resaleItems.filter(it => !it.sold).length;
  const kpi = document.getElementById("kpiResale");
  if (kpi) kpi.textContent = resaleCount;
}

function formatDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
}

rsSearch.addEventListener("input", renderResale);
rsCategory.addEventListener("change", renderResale);
rsSort.addEventListener("change", renderResale);

// Details Modal
function openResaleDetails(id){
  const it = resaleItems.find(x => x.id === id);
  if(!it) return;
  rsDetImg.src = it.img || "";
  rsDetImg.style.display = it.img ? "block" : "none";
  rsDetName.textContent = it.name;
  rsDetPrice.textContent = "₹ " + it.price;
  rsDetOwner.textContent = `Seller: ${it.owner} • Posted ${formatDate(it.date)}`;
  rsDetDesc.textContent = it.desc || "—";

  rsMarkSold.onclick = () => {
    it.sold = true;
    alert(`Marked ${it.name} as sold (demo).`);
    closeResaleDetails();
    renderResale();
  };

  rsDetailsModal.classList.add("open");
  document.body.classList.add("modal-open");
}

function closeResaleDetails(){
  rsDetailsModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}
rsDetClose.addEventListener("click", closeResaleDetails);
rsDetCloseBtn.addEventListener("click", closeResaleDetails);
rsDetailsModal.addEventListener("click", e => { if (e.target === rsDetailsModal) closeResaleDetails(); });

// Post Item modal
rsPostBtn.addEventListener("click", () => {
  postItemModal.classList.add("open");
  document.body.classList.add("modal-open");
  document.getElementById("piName").focus();
});

function closePostItem(){
  postItemModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}
piClose.addEventListener("click", closePostItem);
postItemModal.addEventListener("click", e => { if (e.target === postItemModal) closePostItem(); });
piReset.addEventListener("click", () => piForm.reset());

piForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("piName").value.trim();
  const price = parseInt(document.getElementById("piPrice").value, 10);
  const category = document.getElementById("piCategory").value;
  const desc = document.getElementById("piDesc").value.trim();
  const file = document.getElementById("piImg").files[0];

  const newItem = {
    id: "RS-" + String(Math.floor(Math.random()*900)+100),
    name, price, category, desc,
    owner: localStorage.getItem("student_name") || "You",
    date: new Date().toISOString().slice(0,10),
    img: file ? URL.createObjectURL(file) : "",
    sold:false
  };

  resaleItems.unshift(newItem);
  alert("Item posted (demo).");
  piForm.reset();
  closePostItem();
  renderResale();
});

// ======================= Resale Items Modal end ===========================


/* =================== All Notices Modal =================== */
// New Changes

const noticesModal = document.getElementById("noticesModal");
const ntClose = document.getElementById("ntClose");
const allNoticesBody = document.getElementById("allNoticesBody");

// When user clicks "View all notices"
document.getElementById("viewAllNotices").addEventListener("click", () => {
  renderAllNotices();
  noticesModal.classList.add("open");
  document.body.classList.add("modal-open");
});

// Close modal
function closeNoticesModal() {
  noticesModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}

ntClose.addEventListener("click", closeNoticesModal);

noticesModal.addEventListener("click", (e) => {
  if (e.target === noticesModal) closeNoticesModal();
});

// Fill all notices inside modal
function renderAllNotices() {
  allNoticesBody.innerHTML = notices
    .map(
      (n) => `
        <div class="notice-full-card">
          <div class="nt-title">${n.title}</div>
          <div class="nt-meta">${n.date} • ${n.by}</div>
          <div class="nt-desc">${n.desc}</div>
        </div>
      `
    )
    .join("");
}
/* =================== All Notices Modal end =================== */







// Bell Icon Notifications new changes
/* =================== Notifications Modal =================== */

/* const notificationsModal = document.getElementById("notificationsModal");
const ntfClose = document.getElementById("ntfClose");
const notificationsList = document.getElementById("notificationsList");
const notifBell = document.getElementById("notifBell");

// Bell click → open modal
notifBell.addEventListener("click", () => {
  renderNotifications();
  notificationsModal.classList.add("open");
  document.body.classList.add("modal-open");

  // mark all as read
  notifications.forEach(n => (n.read = true));
  updateNotificationBadge();
});

// Close modal
ntfClose.addEventListener("click", () => {
  notificationsModal.classList.remove("open");
  document.body.classList.remove("modal-open");
});

notificationsModal.addEventListener("click", (e) => {
  if (e.target === notificationsModal) {
    notificationsModal.classList.remove("open");
    document.body.classList.remove("modal-open");
  }
});

// Render notification list in modal
function renderNotifications() {
  if (notifications.length === 0) {
    notificationsList.innerHTML = `<p>No notifications</p>`;
    return;
  }

  notificationsList.innerHTML = notifications
    .map(
      (n) => `
        <div class="notification-card">
          <p>${n.message}</p>
          <p class="ntf-time">${n.time}</p>
        </div>
      `
    )
    .join("");
}

// unread badge counter
function updateNotificationBadge() {
  const badge = document.getElementById("notifBadge");
  const unread = notifications.filter((n) => !n.read).length;

  if (unread > 0) {
    badge.textContent = unread;
    badge.style.display = "block";
  } else {
    badge.style.display = "none";
  }
} /*

updateNotificationBadge();
// Bell Icon Notifications new changes ends
/* =================== Notifications Modal end =================== */ 





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
