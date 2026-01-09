/* =========================================================
   Demo data (replace with API later)
   ========================================================= */
const wardenName = localStorage.getItem("warden_name") || "Warden User";
document.getElementById("wardenName").textContent = wardenName;
document.getElementById("year").textContent = new Date().getFullYear();

const staff = [
  { id: "STF-101", name: "Amit (Electrician)" },
  { id: "STF-102", name: "Nilesh (Plumber)" },
  { id: "STF-103", name: "Karan (Network)" },
  { id: "STF-104", name: "Pritesh (General)" },
];

let complaints = [
  { id: "CMP-101", type: "Electrical", title: "Light not working", room: "B-201", slot: "10:00 AM – 12:00 PM", status: "new" },
  { id: "CMP-102", type: "Plumbing",   title: "Tap leaking",      room: "A-108", slot: "02:00 PM – 04:00 PM", status: "assigned", staff: "Amit (Electrician)" },
  { id: "CMP-103", type: "Internet",   title: "Wi-Fi disconnects",room: "C-310", slot: "06:00 PM – 08:00 PM", status: "progress", staff: "Karan (Network)" },
  { id: "CMP-104", type: "Electrical", title: "Faulty AC",        room: "B-305", slot: "04:00 PM – 06:00 PM", status: "pendingApproval",
    staff: "Amit (Electrician)", proofName: "IMG-20251111.jpg", proofUrl: "", remark: "AC capacitor replaced" },
  { id: "CMP-105", type: "General",    title: "Chair broken",     room: "D-210", slot: "12:00 PM – 02:00 PM", status: "resolved", staff: "Pritesh (General)" },
];

/* Demo student ratings */
const ratings = [
  { complaintId: "CMP-090", staff: "Amit (Electrician)",   rating: 4.8 },
  { complaintId: "CMP-085", staff: "Amit (Electrician)",   rating: 4.5 },
  { complaintId: "CMP-071", staff: "Nilesh (Plumber)",     rating: 4.2 },
  { complaintId: "CMP-072", staff: "Nilesh (Plumber)",     rating: 4.0 },
  { complaintId: "CMP-073", staff: "Nilesh (Plumber)",     rating: 3.8 },
  { complaintId: "CMP-060", staff: "Karan (Network)",      rating: 4.6 },
  { complaintId: "CMP-061", staff: "Karan (Network)",      rating: 4.9 },
  { complaintId: "CMP-055", staff: "Pritesh (General)",    rating: 4.7 },
  { complaintId: "CMP-056", staff: "Pritesh (General)",    rating: 4.8 },
];

let notices = [
  { id: "N-01", title: "Water Maintenance", body: "Water supply off today 2–4 PM (Block B).", date: "11 Nov 2025" },
  { id: "N-02", title: "Pest Control",      body: "Rooms 201–230 Friday 10 AM onward.",       date: "10 Nov 2025" },
];

const recentActivity = [
  "CMP-105: Resolved — Chair repaired by Pritesh",
  "CMP-104: Proof submitted — awaiting approval",
  "CMP-103: In-Progress — Router replaced",
];

/* =========================================================
   Helpers
   ========================================================= */
const $ = (id) => document.getElementById(id);
const fmtStatus   = (s) => s.replace(/([A-Z])/g, " $1"); // "pendingApproval" -> "pending Approval"
const statusClass = (s) => `s-${s}`;

/* =========================================================
   Sidebar nav switching (updated: resale is a right-side view)
   ========================================================= */
document.querySelectorAll(".nav-link").forEach((btn) => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;

    // Default behavior: switch visible view panels
    document.querySelectorAll(".nav-link").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    const viewEl = document.getElementById(`view-${view}`);
    if (viewEl) viewEl.classList.add("active");

    // Lazy render the view when opened
    if (view === "complaints")  renderComplaintsTable();
    if (view === "notices")     renderNoticesFull();
    if (view === "performance") renderPerformance();
    if (view === "proofs")      renderProofGrid();
    if (view === "resale")      renderResale();   // NEW: render resale into right-side view
  });
});

/* =========================================================
   KPIs + Overview lists
   ========================================================= */
function refreshKPIs() {
  $("kpiNew").textContent       = complaints.filter((c) => c.status === "new").length;
  $("kpiProgress").textContent  = complaints.filter((c) => ["progress", "assigned"].includes(c.status)).length;
  $("kpiResolved").textContent  = complaints.filter((c) => c.status === "resolved").length;
  $("kpiEscalated").textContent = complaints.filter((c) => c.status === "escalated").length;
}

function renderPending() {
  const list = complaints
    .filter((c) => ["new", "assigned", "progress", "pendingApproval", "escalated"].includes(c.status))
    .slice(0, 6);

  $("pendingList").innerHTML = list.map((c) => {
    const canAssign = c.status === "new"; // only NEW can be assigned
    const actionBtn = c.status === "pendingApproval"
      ? `<button class="btn-primary" onclick="openApprove('${c.id}')">Review Proof</button>`
      : (canAssign ? `<button class="btn-primary" onclick="openAssign('${c.id}')">Assign Staff</button>` : ``);

    return `
      <li>
        <div>
          <strong>${c.id}</strong> — ${c.title}
          <div class="muted">${c.type} • Room ${c.room} • ${fmtStatus(c.status)}</div>
        </div>
        <div class="row-actions">
          <button class="btn-ghost" onclick="openView('${c.id}')">View Details</button>
          ${actionBtn}
        </div>
      </li>`;
  }).join("");
}

function renderRecent() {
  $("recentList").innerHTML = recentActivity.map((a) => `<li><span>${a}</span></li>`).join("");
}

function renderNotices() {
  $("noticeList").innerHTML = notices.slice(0, 5).map((n) => `
    <li>
      <div>
        <strong>${n.title}</strong>
        <div class="muted">${n.date}</div>
      </div>
    </li>`).join("");
}

/* =========================================================
   Complaints table
   ========================================================= */
$("filterStatus").addEventListener("change", renderComplaintsTable);

function renderComplaintsTable() {
  const filter = $("filterStatus").value;
  const list = complaints.filter((c) => (filter === "all" ? true : c.status === filter));

  $("complaintsBody").innerHTML = list.map((c) => {
    let actionHtml = "";

    // Explicit actions per status
    if (c.status === "pendingApproval") {
      actionHtml = `<button class="btn-primary" onclick="openApprove('${c.id}')">Approve</button>`;

    } else if (c.status === "new") {
      actionHtml = `<button class="btn-primary" onclick="openAssign('${c.id}')">Assign</button>`;

    } else if (c.status === "assigned") {
      // Show a disabled "Assigned" button with tooltip to whom
      const to = c.staff ? `Assigned to ${c.staff}` : "Assigned";
      actionHtml = `<button class="btn-disabled" disabled title="${to}">Assigned</button>`;

    } else if (c.status === "progress") {
      actionHtml = `<button class="btn-disabled" disabled title="${c.staff ? 'In progress by ' + c.staff : 'In progress'}">In Progress</button>`;

    } else if (c.status === "resolved") {
      actionHtml = `<button class="btn-disabled" disabled title="Completed">Resolved</button>`;

    } else if (c.status === "escalated") {
      actionHtml = `<button class="btn-disabled" disabled title="Escalated to Warden">Escalated</button>`;

    } else {
      actionHtml = `<span class="muted">—</span>`;
    }

    return `
      <tr>
        <td>${c.id}</td>
        <td>${c.type}</td>
        <td>${c.title}</td>
        <td>${c.room}</td>
        <td>${c.slot || "-"}</td>
        <td><span class="status ${statusClass(c.status)}">${fmtStatus(c.status)}</span></td>
        <td>
          <button class="btn-ghost" onclick="openView('${c.id}')">View</button>
          ${actionHtml}
        </td>
      </tr>`;
  }).join("");
}


/* =========================================================
   Assign Staff (NO time slot here)
   ========================================================= */
const assignModal       = $("assignModal");
const assignForm        = $("assignForm");
const assignClose       = $("assignClose");
const assignCancel      = $("assignCancel");
const assignStaff       = $("assignStaff");
const assignComplaintId = $("assignComplaintId");

// dropdown options
if (assignStaff) {
  assignStaff.innerHTML = staff.map((s) => `<option value="${s.name}">${s.name}</option>`).join("");
}

window.openAssign = (id) => { if (assignComplaintId) { assignComplaintId.value = id; assignModal.classList.add("open"); } };
function closeAssign(){ assignModal?.classList.remove("open"); }
assignClose?.addEventListener("click", closeAssign);
assignCancel?.addEventListener("click", closeAssign);
assignModal?.addEventListener("click", (e) => { if (e.target === assignModal) closeAssign(); });

assignForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const id  = assignComplaintId?.value;
  const idx = complaints.findIndex((c) => c.id === id);
  if (idx > -1) {
    complaints[idx].status = "assigned";
    complaints[idx].staff  = assignStaff.value;
    recentActivity.unshift(`${id}: Assigned to ${assignStaff.value}`);
  }
  closeAssign();
  refreshKPIs(); renderPending(); renderComplaintsTable(); renderProofGrid(); // keep proofs view fresh too
  alert(`Assigned ${id} to ${assignStaff.value} (demo).`);
});

/* =========================================================
   Approve / Reject Resolution
   ========================================================= */
const approveModal   = $("approveModal");
const approveClose   = $("approveClose");
const approvePreview = $("approvePreview");
const approveSummary = $("approveSummary");
const approveBtn     = $("approveBtn");
const rejectBtn      = $("rejectBtn");
let approveCurrentId = null;

window.openApprove = (id) => {
  const c = complaints.find((x) => x.id === id);
  if (!c) return;
  approveCurrentId = id;

  approveSummary.innerHTML =
    `<strong>${c.id}</strong> — ${c.title}
     <div class="muted">${c.type} • Room ${c.room} • ${c.staff || "-"}</div>
     <div class="muted">${c.remark || ""}</div>`;

  if (c.proofUrl) approvePreview.innerHTML = `<img src="${c.proofUrl}" alt="proof" />`;
  else approvePreview.textContent = c.proofName ? c.proofName : "No image";

  approveModal?.classList.add("open");
};
function closeApprove(){ approveModal?.classList.remove("open"); }
approveClose?.addEventListener("click", closeApprove);
approveModal?.addEventListener("click", (e) => { if (e.target === approveModal) closeApprove(); });

approveBtn?.addEventListener("click", () => {
  const idx = complaints.findIndex((c) => c.id === approveCurrentId);
  if (idx > -1) {
    complaints[idx].status = "resolved";
    recentActivity.unshift(`${approveCurrentId}: Approved & marked Resolved`);
  }
  closeApprove();
  refreshKPIs(); renderPending(); renderComplaintsTable(); renderProofGrid();
});
rejectBtn?.addEventListener("click", () => {
  const idx = complaints.findIndex((c) => c.id === approveCurrentId);
  if (idx > -1) {
    complaints[idx].status = "progress";
    recentActivity.unshift(`${approveCurrentId}: Rejected (back to In-Progress)`);
  }
  closeApprove();
  refreshKPIs(); renderPending(); renderComplaintsTable(); renderProofGrid();
});

/* =========================================================
   Notices
   ========================================================= */
const noticeModal      = $("noticeModal");
const noticeForm       = $("noticeForm");
const noticeClose      = $("noticeClose");
const noticeCancel     = $("noticeCancel");
const noticeTitleInput = $("noticeTitleInput");
const noticeBodyInput  = $("noticeBodyInput");
const postNoticeBtn    = $("postNoticeBtn");
const postNoticeBtn2   = $("postNoticeBtn2");

function openNotice(){ noticeModal?.classList.add("open"); }
function closeNotice(){ noticeModal?.classList.remove("open"); }
[postNoticeBtn, postNoticeBtn2].forEach((b)=> b?.addEventListener("click", openNotice));
noticeClose?.addEventListener("click", closeNotice);
noticeCancel?.addEventListener("click", closeNotice);
noticeModal?.addEventListener("click", (e)=>{ if(e.target===noticeModal) closeNotice(); });

noticeForm?.addEventListener("submit",(e)=>{
  e.preventDefault();
  const t = noticeTitleInput.value.trim();
  const b = noticeBodyInput.value.trim();
  if(!t || !b) return;
  notices.unshift({ id:`N-${(Math.random()*10000|0)}`, title:t, body:b, date:new Date().toLocaleDateString() });
  closeNotice(); noticeForm.reset();
  renderNotices(); renderNoticesFull();
  alert("Notice published (demo).");
});

function renderNoticesFull(){
  $("noticesFull").innerHTML = notices.map(n=>`
    <li>
      <div>
        <strong>${n.title}</strong>
        <div class="muted">${n.date}</div>
        <div>${n.body}</div>
      </div>
    </li>`).join("");
}

/* =========================================================
   View details (simple for now)
   ========================================================= */
window.openView = (id)=>{
  const c = complaints.find(x=>x.id===id);
  if(!c) return;
  alert(`${c.id}\n${c.title}\n${c.type} — Room ${c.room}\nStatus: ${fmtStatus(c.status)}\nStaff: ${c.staff||"-"}\nSlot: ${c.slot||"-"}`);
};

/* =========================================================
   PERFORMANCE VIEW (avg rating, resolved counts, charts)
   ========================================================= */
function computeStaffStats(){
  const stats = {};
  staff.forEach(s => { stats[s.name] = { name:s.name, assigned:0, progress:0, resolved:0, ratings:[], avg:0 }; });

  complaints.forEach(c=>{
    if(!c.staff || !stats[c.staff]) return;
    if(c.status==="assigned") stats[c.staff].assigned++;
    if(c.status==="progress" || c.status==="pendingApproval") stats[c.staff].progress++;
    if(c.status==="resolved") stats[c.staff].resolved++;
  });

  ratings.forEach(r=>{ if(stats[r.staff]) stats[r.staff].ratings.push(r.rating); });
  Object.values(stats).forEach(s=>{ s.avg = s.ratings.length ? (s.ratings.reduce((a,b)=>a+b,0) / s.ratings.length) : 0; });
  return stats;
}

function renderBarChart(containerId, rows, maxValue, formatValue = v=>String(v)){
  const root = $(containerId);
  root.innerHTML = rows.map(r=>{
    const pct = maxValue ? Math.round((r.value / maxValue) * 100) : 0;
    return `
      <div class="bar-row">
        <div class="bar-label" title="${r.label}">${r.label}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <div class="bar-value">${formatValue(r.value)}</div>
      </div>`;
  }).join("");
}

function renderPerformance(){
  const statsObj = computeStaffStats();
  const rows = Object.values(statsObj);

  $("perfTotalStaff").textContent    = rows.length;
  $("perfTotalResolved").textContent = rows.reduce((a,s)=>a+s.resolved,0);
  const allRatings = rows.flatMap(s=>s.ratings);
  $("perfAvgAll").textContent = (allRatings.length ? (allRatings.reduce((a,b)=>a+b,0)/allRatings.length) : 0).toFixed(1);

  $("perfBody").innerHTML = rows.map(s=>`
    <tr>
      <td>${s.name}</td>
      <td>${s.resolved}</td>
      <td>${s.assigned}</td>
      <td>${s.progress}</td>
      <td>${s.avg.toFixed(1)}</td>
      <td>${s.ratings.length}</td>
    </tr>`).join("");

  const resolvedRows = rows.map(s=>({ label:s.name, value:s.resolved }));
  const ratingRows   = rows.map(s=>({ label:s.name, value:Number(s.avg.toFixed(2)) }));

  const maxResolved = Math.max(1, ...resolvedRows.map(r=>r.value));
  renderBarChart("chartResolved", resolvedRows, maxResolved, v=>v);

  const maxRating = 5; // fixed scale
  renderBarChart("chartRating", ratingRows, maxRating, v=>v.toFixed(1));
}

/* =========================================================
   PROOFS VIEW (thumbnails -> approve modal)
   ========================================================= */
function renderProofGrid(){
  const container = document.getElementById("proofGrid");
  const items = complaints
    .filter(c => c.status === "pendingApproval")
    .slice().reverse(); // newest first (placeholder)

  if (!items.length){
    container.innerHTML = `<p class="muted" style="margin:6px 0">No proofs awaiting review.</p>`;
    return;
  }

  container.innerHTML = items.map(c => {
    const src = c.proofUrl || "";
    const thumb = src ? `<img src="${src}" alt="proof for ${c.id}">` : "";
    return `
      <button class="proof-card" data-id="${c.id}" title="Review ${c.id}">
        <div class="proof-thumb">
          ${thumb || `<svg viewBox="0 0 24 24" width="48" height="48" style="margin:18% auto;opacity:.35">
              <path fill="currentColor" d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14l4-4h12a2 2 0 0 0 2-2zM8.5 11A1.5 1.5 0 1 1 10 9.5 1.5 1.5 0 0 1 8.5 11z"/>
            </svg>`}
        </div>
        <div class="proof-meta">
          <span class="pid">${c.id}</span>
          <span class="ptitle">${c.title}</span>
          <span class="pstaff">${c.staff || "—"}</span>
        </div>
      </button>`;
  }).join("");

  container.querySelectorAll(".proof-card").forEach(btn=>{
    btn.addEventListener("click", () => openApprove(btn.dataset.id));
  });
}

/* =========================================================
   Top‐right buttons
   ========================================================= */
$("logoutBtn")?.addEventListener("click", ()=> location.href = "../auth/index.html");
$("notifBtn")?.addEventListener("click", ()=> alert("No new notifications."));
$("profileBtn")?.addEventListener("click", ()=> alert("Warden profile opens here."));

/* =========================================================
   Initial render
   ========================================================= */
refreshKPIs();
renderPending();
renderRecent();
renderNotices();
renderComplaintsTable();
renderNoticesFull();
/* Optional: pre-render so views open instantly */
renderPerformance();
renderProofGrid();

/* ================= Resale Market (Warden) - cleaned for right-side view =================== */
/* Demo resale items (same shape used in student.js) */
let resaleItems = [
  { id:"RS-001", name:"Study Table", price:1200, owner:"Amit (B-203)", category:"furniture", date:"2025-11-10", img:"", desc:"Solid wood, good condition.", sold:false },
  { id:"RS-002", name:"Router TP-Link", price:800, owner:"Neha (A-108)", category:"electronics", date:"2025-11-09", img:"", desc:"Dual band router, works fine.", sold:false },
  { id:"RS-003", name:"DSA Book", price:250, owner:"Karan (C-310)", category:"books", date:"2025-11-08", img:"", desc:"Clean copy, few highlights.", sold:false },
  { id:"RS-004", name:"Chair", price:400, owner:"Priya (B-401)", category:"furniture", date:"2025-11-07", img:"", desc:"Plastic chair, barely used.", sold:false },
];

/* DOM refs (no centered listing modal) */
const rsSearch = document.getElementById("rsSearch");
const rsCategory = document.getElementById("rsCategory");
const rsSort = document.getElementById("rsSort");
const rsGrid = document.getElementById("rsGrid");

const rsDetailsModal = document.getElementById("rsDetailsModal");
const rsDetClose = document.getElementById("rsDetClose");
const rsDetCloseBtn = document.getElementById("rsDetCloseBtn");
const rsDetImg = document.getElementById("rsDetImg");
const rsDetName = document.getElementById("rsDetName");
const rsDetPrice = document.getElementById("rsDetPrice");
const rsDetOwner = document.getElementById("rsDetOwner");
const rsDetDesc = document.getElementById("rsDetDesc");
const rsMarkSold = document.getElementById("rsMarkSold");

const postItemModal = document.getElementById("postItemModal");
const rsPostBtn = document.getElementById("rsPostBtn");
const piClose = document.getElementById("piClose");
const piForm = document.getElementById("piForm");
const piReset = document.getElementById("piReset");

function formatDate(iso){ const d=new Date(iso); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }

/* Render listing into the right-side view element #rsGrid */
function renderResale(){
  if (!rsGrid) return;
  const q = rsSearch?.value?.trim().toLowerCase() || "";
  const cat = rsCategory?.value || "all";
  const sort = rsSort?.value || "new";

  let list = resaleItems.filter(it => !it.sold);
  if (cat !== "all") list = list.filter(it => it.category === cat);
  if (q) list = list.filter(it => it.name.toLowerCase().includes(q) || (it.desc||"").toLowerCase().includes(q));

  list.sort((a,b) => {
    if (sort === "priceAsc") return a.price - b.price;
    if (sort === "priceDesc") return b.price - a.price;
    if (sort === "old") return new Date(a.date) - new Date(b.date);
    return new Date(b.date) - new Date(a.date); // "new"
  });

  rsGrid.innerHTML = list.map(it => `
    <div class="rs-card">
      <div class="rs-thumb">${it.img ? `<img src="${it.img}" alt="">` : "🖼️"}</div>
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

/* Details modal (kept as modal) */
function openResaleDetails(id){
  const it = resaleItems.find(x => x.id === id);
  if(!it) return;
  if (rsDetImg) {
    rsDetImg.src = it.img || "";
    rsDetImg.style.display = it.img ? "block" : "none";
  }
  if (rsDetName) rsDetName.textContent = it.name;
  if (rsDetPrice) rsDetPrice.textContent = "₹ " + it.price;
  if (rsDetOwner) rsDetOwner.textContent = `Seller: ${it.owner} • Posted ${formatDate(it.date)}`;
  if (rsDetDesc) rsDetDesc.textContent = it.desc || "—";

  if (rsMarkSold) {
    rsMarkSold.onclick = () => {
      it.sold = true;  // demo only
      alert(`Marked ${it.name} as sold (demo).`);
      closeResaleDetails();
      renderResale();
    };
  }

  if (rsDetailsModal) {
    rsDetailsModal.classList.add("open");
    document.body.classList.add("modal-open");
  }
}
function closeResaleDetails(){
  if (rsDetailsModal) {
    rsDetailsModal.classList.remove("open");
    document.body.classList.remove("modal-open");
  }
}
rsDetClose?.addEventListener("click", closeResaleDetails);
rsDetCloseBtn?.addEventListener("click", closeResaleDetails);
rsDetailsModal?.addEventListener("click", e => { if (e.target === rsDetailsModal) closeResaleDetails(); });

/* Wire up filters/search/sort */
rsSearch?.addEventListener("input", renderResale);
rsCategory?.addEventListener("change", renderResale);
rsSort?.addEventListener("change", renderResale);

/* Post Item modal handlers (kept as modal) */
rsPostBtn?.addEventListener("click", () => {
  if (!postItemModal) return alert("Post Item modal not found.");
  postItemModal.classList.add("open");
  document.body.classList.add("modal-open");
  const el = document.getElementById("piName");
  if (el) el.focus();
});
function closePostItem(){
  postItemModal?.classList.remove("open");
  document.body.classList.remove("modal-open");
}
piClose?.addEventListener("click", closePostItem);
postItemModal?.addEventListener("click", e => { if (e.target === postItemModal) closePostItem(); });
piReset?.addEventListener("click", () => piForm?.reset());

piForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("piName").value.trim();
  const price = parseInt(document.getElementById("piPrice").value, 10) || 0;
  const category = document.getElementById("piCategory").value;
  const desc = document.getElementById("piDesc").value.trim();
  const file = document.getElementById("piImg").files[0];

  const newItem = {
    id: "RS-" + String(Math.floor(Math.random()*900)+100),
    name, price, category, desc,
    owner: "Warden • Institute",
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
/* ================= end Resale code =================== */


/* ================= Warden Profile Modal (new changes) ================= */

// refs
/* ================= Warden Profile Modal (new changes) ================= */

// Modal references
const wpModal = document.getElementById("wardenProfileModal");
const wpClose = document.getElementById("wpClose");
const wpForm = document.getElementById("wpForm");

// Left panel
const wpNameLeft = document.getElementById("wpNameLeft");
const wpMiniMeta = document.getElementById("wpMiniMeta");
const wpPhoto = document.getElementById("wpPhoto");
const wpPhotoFallback = document.getElementById("wpPhotoFallback");
const wpPhotoInput = document.getElementById("wpPhotoInput");
const wpChangePhoto = document.getElementById("wpChangePhoto");

// Form fields
const wpFullName = document.getElementById("wpFullName");
const wpEmail = document.getElementById("wpEmail");
const wpPhone = document.getElementById("wpPhone");
const wpEmpId = document.getElementById("wpEmpId");
const wpAbout = document.getElementById("wpAbout");
const wpNotes = document.getElementById("wpNotes");

// Block selection buttons (A–D)
let selectedBlock = localStorage.getItem("warden_block") || "";
const blockButtons = document.querySelectorAll(".block-btn");

// ================= Prefill Stored Data =================
function prefillWardenProfile() {
  wpFullName.value = localStorage.getItem("warden_name") || "";
  wpEmail.value = localStorage.getItem("warden_email") || "";
  wpPhone.value = localStorage.getItem("warden_phone") || "";
  wpEmpId.value = localStorage.getItem("warden_empid") || "";
  wpAbout.value = localStorage.getItem("warden_about") || "";
  wpNotes.value = localStorage.getItem("warden_notes") || "";

  // Stored block selection
  selectedBlock = localStorage.getItem("warden_block") || "";
  blockButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.block === selectedBlock);
  });

  // Left panel info
  wpNameLeft.textContent = wpFullName.value || "Warden";
  wpMiniMeta.textContent = selectedBlock ? `Block: ${selectedBlock}` : "Block: -";
}

// ================= Modal Open / Close =================
function openWardenProfile() {
  prefillWardenProfile();
  wpModal.classList.add("open");
  document.body.classList.add("modal-open");
}

function closeWardenProfile() {
  wpModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}

wpClose.addEventListener("click", closeWardenProfile);

wpModal.addEventListener("click", e => {
  if (e.target === wpModal) closeWardenProfile();
});

// Topbar profile icon → open modal
document.getElementById("profileBtn").addEventListener("click", openWardenProfile);

// ================= Block Selection Buttons =================
blockButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    selectedBlock = btn.dataset.block;
    blockButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Update left panel instantly
    wpMiniMeta.textContent = `Block: ${selectedBlock}`;
  });
});

// ================= Photo Upload =================
wpChangePhoto.addEventListener("click", () => wpPhotoInput.click());

wpPhotoInput.addEventListener("change", () => {
  const file = wpPhotoInput.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  wpPhoto.src = url;
  wpPhoto.style.display = "block";
  wpPhotoFallback.style.display = "none";
});

// ================= Scoped Tab Switching =================
const wpTabButtons = wpModal.querySelectorAll(".tab-btn");
const wpTabPanels = wpModal.querySelectorAll(".tab-panel");

wpTabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;

    // activate button
    wpTabButtons.forEach((b) =>
      b.classList.toggle("active", b === btn)
    );

    // activate panel
    wpTabPanels.forEach((p) =>
      p.classList.toggle("active", p.id === `tab-${tab}`)
    );
  });
});

// ================= Save Profile (LOCAL ONLY) =================
wpForm.addEventListener("submit", (e) => {
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

/* ================= end Warden Profile Modal ================= */

