/* ===========================================================
   Student Dashboard (Frontend Only)
   - Dashboard KPIs, Notices, Activity
   - Lodge Complaint Modal
   - My Complaints Modal
   =========================================================== */

// === BASIC DASHBOARD SETUP ===

// Student name
const name = localStorage.getItem("student_name") || "Student Name";
document.getElementById("studentName").textContent = name;

// Year in footer
document.getElementById("year").textContent = new Date().getFullYear();

// KPIs (demo values)
const kpis = { pending: 3, resolved: 12, resale: 5 };
document.getElementById("kpiPending").textContent  = kpis.pending;
document.getElementById("kpiResolved").textContent = kpis.resolved;
document.getElementById("kpiResale").textContent   = kpis.resale;

// Notices (Posted by Warden)
const notices = [
  { date: "10/11/2025", title: "Water supply maintenance", by: "Warden • Block B", desc: "Water off 2–4 PM." },
  { date: "09/11/2025", title: "Common room cleaning", by: "Warden • Block A", desc: "Clear personal items." },
  { date: "08/11/2025", title: "Pest control schedule", by: "Warden • Block C", desc: "Rooms 201–230 Friday." },
];
const noticeList = document.getElementById("noticeList");
noticeList.innerHTML = notices.map(n => `
  <li class="notice">
    <span class="date">${n.date}</span>
    <div>
      <p class="title">${n.title}</p>
      <p class="meta">${n.by} — ${n.desc}</p>
    </div>
  </li>
`).join("");

// Activity (demo)
const activity = [
  { text: "Raised complaint: 'Fan not working'", amount: "" },
  { text: "Complaint #102 marked Resolved", amount: "" },
  { text: "Viewed notice: Water supply maintenance", amount: "" },
];
document.getElementById("activityList").innerHTML =
  activity.map(a => `<li><span>${a.text}</span><span>${a.amount}</span></li>`).join("");

// === BASIC BUTTONS ===
document.getElementById("logoutBtn").addEventListener("click", () => {
  window.location.href = "../auth/index.html"; // back to your combined login/register
});
document.getElementById("notifBtn").addEventListener("click", () => {
  alert("No new notifications.");
});
document.getElementById("profileBtn").addEventListener("click", () => {
  alert("Open Profile page (to be implemented).");
});

// ==================================================================
// === QUICK LINKS: OPEN MODALS ===
document.querySelectorAll(".ql-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.open;
    if (target === "raiseComplaint") openComplaintModal();
    else if (target === "myComplaints") openComplaintsModal();
    else if (target === "resaleMarket") openResaleModal();
    else if (target === "profile") openProfileModal();
  });
});

// ==================================================================
// === LODGE COMPLAINT MODAL ===
/* ===== Lodge Complaint modal (with date + slot locking, demo only) ===== */
const modal   = document.getElementById("complaintModal");
const closeBtn= document.getElementById("lcClose");
const form    = document.getElementById("lcForm");

const BOOK_KEY = "dhcr_bookedSlots"; // { "YYYY-MM-DD": ["08:00–10:00", ...] }
function loadBooked(){ try { return JSON.parse(localStorage.getItem(BOOK_KEY)) || {}; } catch { return {}; } }
function saveBooked(map){ localStorage.setItem(BOOK_KEY, JSON.stringify(map)); }

/* Disable already-taken slots for a given date (demo, per-browser) */
function refreshSlotOptions(dateStr){
  const booked = loadBooked();
  const taken = new Set(booked[dateStr] || []);
  const slotSel = document.getElementById("lcSlot");
  [...slotSel.options].forEach(opt => {
    if (!opt.value) return;              // skip placeholder if any
    const label = opt.text.trim();       // e.g. "08:00–10:00"
    opt.disabled = taken.has(label);
  });
}

function openComplaintModal() {
  modal.classList.add("open");
  document.body.classList.add("modal-open");
  setTimeout(() => document.getElementById("lcType").focus(), 0);

  // ---- Date defaults & constraints (today .. +14 days) ----
  const dateInput = document.getElementById("lcDate"); // <-- make sure you added this <input type="date" id="lcDate" required>
  if (dateInput){
    const toISO = (dt) => dt.toISOString().slice(0,10);
    const today = new Date();
    const max   = new Date(today); max.setDate(today.getDate() + 14);

    dateInput.min = toISO(today);
    dateInput.max = toISO(max);
    if (!dateInput.value) dateInput.value = toISO(today);

    // Disable taken slots for selected date
    refreshSlotOptions(dateInput.value);
    dateInput.onchange = () => refreshSlotOptions(dateInput.value);
  } else {
    console.warn("lcDate input not found. Add: <input type='date' id='lcDate' required>");
  }
}

function closeComplaintModal() {
  modal.classList.remove("open");
  document.body.classList.remove("modal-open");
}

closeBtn.addEventListener("click", closeComplaintModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeComplaintModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("open")) closeComplaintModal(); });

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const dateInput = document.getElementById("lcDate");
  const slotSel   = document.getElementById("lcSlot");

  const dateStr   = dateInput ? dateInput.value : "";                 // "YYYY-MM-DD"
  const slotText  = slotSel.options[slotSel.selectedIndex]?.text || ""; // "08:00–10:00"

  // ---- Conflict check (demo-only; real app must check on backend) ----
  if (dateStr && slotText){
    const booked = loadBooked();
    const taken = new Set(booked[dateStr] || []);
    if (taken.has(slotText)) {
      alert("That time slot is already taken for this date. Please choose another.");
      return;
    }
    // Reserve locally so the same browser can’t re-book it
    booked[dateStr] = [...taken, slotText];
    saveBooked(booked);
  }

  // Collect form data (now includes date)
  const data = {
    type:  document.getElementById("lcType").value,
    title: document.getElementById("lcTitleInput").value.trim(),
    date:  dateStr, // <-- NEW
    desc:  document.getElementById("lcDesc").value.trim(),
    slot:  slotText,
    proof: document.getElementById("lcProof").files[0]?.name || ""
  };

  alert("Complaint submitted (demo): " + JSON.stringify(data, null, 2));
  form.reset();
  closeComplaintModal();
});


// ==================================================================
// === MY COMPLAINTS MODAL ===
// ======================= My Complaints Modal ===========================
const complaintsModal = document.getElementById("complaintsModal");
const mcClose  = document.getElementById("mcClose");
const mcBody   = document.getElementById("complaintsBody");
const mcFilter = document.getElementById("mcFilter");

// Demo complaints data
const complaintsData = [
  { id: "CMP-101", type: "Electrical", title: "Light not working",   date: "11-Nov-2025", slot: "10:00 AM – 12:00 PM", status: "pending"  },
  { id: "CMP-102", type: "Plumbing",   title: "Tap leaking",         date: "10-Nov-2025", slot: "02:00 PM – 04:00 PM", status: "resolved" },
  { id: "CMP-103", type: "Internet",   title: "Wi-Fi disconnects",   date: "09-Nov-2025", slot: "06:00 PM – 08:00 PM", status: "progress" },
];

function renderComplaints(filter = "all") {
  mcBody.innerHTML = complaintsData
    .filter(c => filter === "all" || c.status === filter)
    .map(c => `
      <tr>
        <td>${c.id}</td>
        <td>${c.type}</td>
        <td>${c.title}</td>
        <td>${c.date}</td>
        <td>${c.slot}</td>
        <td><span class="status-chip status-${c.status}">${c.status}</span></td>
        <td><button class="action-btn" onclick="viewComplaint('${c.id}')">View</button></td>
      </tr>
    `).join("");
}

function openComplaintsModal() {
  complaintsModal.classList.add("open");
  document.body.classList.add("modal-open");
  renderComplaints(mcFilter.value || "all");
}

function closeComplaintsModal() {
  complaintsModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}

// Events
mcClose.addEventListener("click", closeComplaintsModal);
complaintsModal.addEventListener("click", (e) => {
  if (e.target === complaintsModal) closeComplaintsModal();
});
mcFilter.addEventListener("change", () => renderComplaints(mcFilter.value));

function viewComplaint(id) {
  alert(`Viewing details for ${id} (coming soon).`);
}

// ======================= My Complaints Modal end ===========================

// ======================= Resale Items Modal ===========================
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

// Demo items
let resaleItems = [
  { id:"RS-001", name:"Study Table", price:1200, owner:"Amit (B-203)", category:"furniture", date:"2025-11-10", img:"", desc:"Solid wood, good condition.", sold:false },
  { id:"RS-002", name:"Router TP-Link", price:800, owner:"Neha (A-108)", category:"electronics", date:"2025-11-09", img:"", desc:"Dual band router, works fine.", sold:false },
  { id:"RS-003", name:"DSA Book", price:250, owner:"Karan (C-310)", category:"books", date:"2025-11-08", img:"", desc:"Clean copy, few highlights.", sold:false },
  { id:"RS-004", name:"Chair", price:400, owner:"Priya (B-401)", category:"furniture", date:"2025-11-07", img:"", desc:"Plastic chair, barely used.", sold:false },
];

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

// Render grid with filters
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
    return new Date(b.date) - new Date(a.date); // "new"
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

  // attach view handlers
  rsGrid.querySelectorAll(".rs-view").forEach(btn => {
    btn.addEventListener("click", () => openResaleDetails(btn.dataset.id));
  });
}
function formatDate(iso){ const d=new Date(iso); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }

rsSearch.addEventListener("input", renderResale);
rsCategory.addEventListener("change", renderResale);
rsSort.addEventListener("change", renderResale);

// ----- Details modal -----
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
    it.sold = true;  // demo only
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

// ----- Post Item modal -----
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
const tabPanels  = document.querySelectorAll(".tab-panel");

// demo prefill (later: fetch from API)
function prefillProfile(){
  const nm = localStorage.getItem("student_name") || "Student Name";
  pfNameLeft.textContent = nm;
  pfFullName.value = nm;

  pfEmail.value = localStorage.getItem("student_email") || "name@iiitpune.edu";
  pfRoll.value  = localStorage.getItem("student_roll")  || "BIA27-0001";
  pfMiniMeta.innerHTML = `PRN: ${pfRoll.value}`;

  // other fields can be kept as-is (empty) for now
}

function openProfileModal(){
  prefillProfile();
  profileModal.classList.add("open");
  document.body.classList.add("modal-open");
}
function closeProfileModal(){
  profileModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}

// close handlers
pfClose.addEventListener("click", closeProfileModal);
profileModal.addEventListener("click", e => { if (e.target === profileModal) closeProfileModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && profileModal.classList.contains("open")) closeProfileModal(); });

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
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    tabButtons.forEach(b => b.classList.toggle("active", b === btn));
    tabPanels.forEach(p => p.classList.toggle("active", p.id === `tab-${tab}`));
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