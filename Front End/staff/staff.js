/* =========================================================
   Basic demo data (replace with API later)
   ========================================================= */
const staffName = localStorage.getItem("staff_name") || "Staff Member";
const staffRole = localStorage.getItem("staff_role") || "Electrician";
document.getElementById("staffName").textContent = staffName;
document.getElementById("staffRole").textContent = `(Role: ${staffRole})`;
document.getElementById("year").textContent = new Date().getFullYear();

let jobs = [
  // NOTE: no 'date' here; we'll auto-assign demo dates for current week
  { id:"CMP-301", type:"Electrical", title:"Faulty AC",         room:"B-201", slot:"10:00 AM – 12:00 PM", status:"assigned" },
  { id:"CMP-298", type:"Plumbing",   title:"Leak in Sink",      room:"305",   slot:"02:00 PM – 04:00 PM", status:"progress" },
  { id:"CMP-288", type:"Electrical", title:"Lightbulb Change",  room:"102",   slot:"04:00 PM – 06:00 PM", status:"assigned" },
  { id:"CMP-280", type:"Internet",   title:"Wi-Fi disconnects", room:"C-310", slot:"06:00 PM – 08:00 PM", status:"resolved" },
];

const alerts = [
  "Warden updated visit timing for Room 101",
  "Inventory restock complete",
  "Meeting tomorrow at 9 AM",
  "Safety audit this Friday at 3 PM"
];

/* =========================================================
   Auto-assign demo dates => each job gets a date in THIS week
   (When backend provides real dates, remove ensureJobDates())
   ========================================================= */
function toISODate(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0,10); }
function getWeekStart(d){
  const s = new Date(d);
  const day = (s.getDay() + 6) % 7; // Monday=0
  s.setDate(s.getDate() - day);
  s.setHours(0,0,0,0);
  return s;
}
function ensureJobDates(){
  const start = getWeekStart(new Date());
  jobs = jobs.map((j, i) => {
    if (j.date) return j;         // keep real date if you add later
    const d = new Date(start);
    d.setDate(start.getDate() + (i % 7)); // spread across Mon–Sun
    return { ...j, date: toISODate(d) };
  });
}
ensureJobDates();

/* =========================================================
   KPIs + Lists (left pane + alerts)
   ========================================================= */
function refreshKPIs() {
  const assigned = jobs.filter(j => j.status !== "resolved").length; // outstanding (incl. pendingApproval)
  const visitsToday = 12;     // demo
  const completedMonth = 98;  // demo
  const avgRating = 4.7;      // demo

  document.getElementById("kpiAssigned").textContent = assigned;
  document.getElementById("kpiVisits").textContent = visitsToday;
  document.getElementById("kpiCompleted").textContent = completedMonth;
  document.getElementById("kpiRating").textContent = avgRating.toFixed(1);

  const filled = "★★★★★".slice(0, Math.round(avgRating));
  const empty  = "☆☆☆☆☆".slice(Math.round(avgRating));
  document.getElementById("kpiStars").textContent = filled + empty;
}

function renderTasks() {
  const el = document.getElementById("taskList");
  const list = [...jobs].sort((a,b) => a.id < b.id ? 1 : -1);
  el.innerHTML = list.map(j => `
    <li class="task">
      <div>
        <p class="title">${j.title}</p>
        <p class="meta">${j.type} • Room ${j.room} • ${j.status} • ${j.id}</p>
      </div>
      <button class="action-btn" onclick="openJobsModal()">View Details</button>
    </li>
  `).join("");
}

function renderAlerts() {
  document.getElementById("noticeList").innerHTML =
    alerts.map(n => `<li>${n}</li>`).join("");
}

/* Initial paint */
refreshKPIs();
renderTasks();
renderAlerts();

/* Top-right actions + Quick links */
document.querySelectorAll(".ql-btn").forEach(b => {
  b.addEventListener("click", () => {
    const t = b.dataset.open;
    if (t === "jobs") openJobsModal();
    if (t === "calendar") openCalModal();
    if (t === "performance") openPerfModal();
  });
});
document.getElementById("logoutBtn").addEventListener("click", () => location.href = "../auth/index.html");
document.getElementById("notifBtn").addEventListener("click", () => alert("No new notifications."));
document.getElementById("profileBtn").addEventListener("click", () => alert("Staff profile will open here."));

/* =========================================================
   My Assigned Complaints (table) + Resolve Proof workflow
   ========================================================= */
const jobsModal  = document.getElementById("jobsModal");
const jobsClose  = document.getElementById("jobsClose");
const jobsFilter = document.getElementById("jobsFilter");
const jobsBody   = document.getElementById("jobsBody");

function openJobsModal(){
  jobsModal.classList.add("open");
  document.body.classList.add("modal-open");
  renderJobsTable(jobsFilter?.value || "all");
}
function closeJobsModal(){
  jobsModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}
jobsClose?.addEventListener("click", closeJobsModal);
jobsModal?.addEventListener("click", e => { if (e.target === jobsModal) closeJobsModal(); });
jobsFilter?.addEventListener("change", () => renderJobsTable(jobsFilter.value));

function renderJobsTable(filter="all"){
  jobsBody.innerHTML = jobs
    .filter(j => filter==="all" || j.status===filter)
    .map(j => {
      const niceStatus = j.status.replace(/([A-Z])/g,' $1'); // pendingApproval -> pending Approval
      let actionHtml = "";
      if (j.status === "resolved") actionHtml = `<span class="muted">Resolved</span>`;
      else if (j.status === "pendingApproval") actionHtml = `<span class="muted">Awaiting Approval</span>`;
      else actionHtml = `<button class="action-btn" onclick="markResolved('${j.id}')">Mark Resolved</button>`;
      return `
        <tr>
          <td>${j.id}</td><td>${j.type}</td><td>${j.title}</td>
          <td>${j.room}</td><td>${j.slot}</td>
          <td><span class="status-chip status-${j.status}">${niceStatus}</span></td>
          <td>${actionHtml}</td>
        </tr>
      `;
    }).join("");
}

/* ---- Proof Upload modal ---- */
const resolveModal   = document.getElementById("resolveModal");
const resClose       = document.getElementById("resClose");
const resCancel      = document.getElementById("resCancel");
const resolveForm    = document.getElementById("resolveForm");
const resJobId       = document.getElementById("resJobId");
const resJobDisplay  = document.getElementById("resJobDisplay");
const resRemark      = document.getElementById("resRemark");
const resProof       = document.getElementById("resProof");
const resPreview     = document.getElementById("resPreview");

function openResolveModal(job){
  resJobId.value = job.id;
  resJobDisplay.value = `${job.id} — ${job.title}`;
  resRemark.value = "";
  resProof.value = "";
  resPreview.textContent = "Preview will appear here";
  resolveModal.classList.add("open");
  document.body.classList.add("modal-open");
}
function closeResolveModal(){
  resolveModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}
resClose?.addEventListener("click", closeResolveModal);
resCancel?.addEventListener("click", closeResolveModal);
resolveModal?.addEventListener("click", e => { if (e.target === resolveModal) closeResolveModal(); });

resProof?.addEventListener("change", () => {
  const f = resProof.files[0];
  if (!f) { resPreview.textContent = "Preview will appear here"; return; }
  const url = URL.createObjectURL(f);
  resPreview.innerHTML = `<img src="${url}" alt="proof preview">`;
});

function markResolved(id){
  const job = jobs.find(j => j.id === id);
  if (!job) return;
  if (job.status === "resolved")        return alert("Already resolved.");
  if (job.status === "pendingApproval") return alert("Already sent to Warden.");
  openResolveModal(job);
}

resolveForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = resJobId.value;
  const jobIdx = jobs.findIndex(j => j.id === id);
  if (jobIdx < 0) return;

  const file = resProof.files[0];
  if (!file) return alert("Please select an image as proof.");

  // DEMO: mark pending approval locally
  jobs[jobIdx].status = "pendingApproval";
  jobs[jobIdx].proofName = file.name;
  jobs[jobIdx].remark = resRemark.value.trim();

  // TODO (backend): POST /complaints/:id/resolve with FormData(...)
  alert("Sent to Warden for approval (demo).");

  closeResolveModal();
  refreshKPIs();
  renderTasks();
  renderJobsTable(jobsFilter?.value || "all");
});

/* =========================================================
   Calendar — Week view with compaction & “+N more”
   ========================================================= */
const calModal = document.getElementById("calModal");
const calClose = document.getElementById("calClose");
const calGrid  = document.getElementById("calGrid");
const calPrev  = document.getElementById("calPrev");
const calNext  = document.getElementById("calNext");
const viewWeek = document.getElementById("viewWeek");
const viewDay  = document.getElementById("viewDay");
const calTodayList = document.getElementById("calTodayList");

const dayMoreModal = document.getElementById("dayMoreModal");
const dayMoreClose = document.getElementById("dayMoreClose");
const dayMoreTitle = document.getElementById("dayMoreTitle");
const dayMoreList  = document.getElementById("dayMoreList");

/* Open/Close */
function openCalModal(){
  calModal.classList.add("open");
  document.body.classList.add("modal-open");
  calendarState = buildInitialCalendarState();
  renderWeek(calendarState);
}
function closeCalModal(){ calModal.classList.remove("open"); document.body.classList.remove("modal-open"); }
calClose?.addEventListener("click", closeCalModal);
calModal?.addEventListener("click", e => { if (e.target===calModal) closeCalModal(); });

/* Nav buttons */
calPrev?.addEventListener("click", () => {
  calendarState.start.setDate(calendarState.start.getDate() - 7);
  renderWeek(calendarState);
});
calNext?.addEventListener("click", () => {
  calendarState.start.setDate(calendarState.start.getDate() + 7);
  renderWeek(calendarState);
});
viewWeek?.addEventListener("click", () => renderWeek(calendarState)); // day view disabled in this demo

/* “+N more” popup */
function openDayMore(date, events){
  dayMoreTitle.textContent = date.toLocaleDateString(undefined, {
    weekday:'long', year:'numeric', month:'short', day:'numeric'
  });
  dayMoreList.innerHTML = events.map(ev => `
    <li class="cal-chip">
      <span class="ic">${ev.icon}</span>
      <span class="txt"><strong>${ev.title}</strong> — Room ${ev.room} • ${ev.slot} • ${ev.type}</span>
    </li>
  `).join("");
  dayMoreModal.classList.add("open");
  document.body.classList.add("modal-open");
}
function closeDayMore(){
  dayMoreModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}
dayMoreClose?.addEventListener("click", closeDayMore);
dayMoreModal?.addEventListener("click", e => { if (e.target===dayMoreModal) closeDayMore(); });

/* State + utils */
let calendarState = null;
function buildInitialCalendarState(){
  const today = new Date();
  const start = getWeekStart(today);
  return { today, start };
}
function parseISODate(s){ const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); }
function endOfWeek(start){ const e = new Date(start); e.setDate(start.getDate()+6); e.setHours(23,59,59,999); return e; }
function isWithinWeek(dt, start){ const e = endOfWeek(start); return dt>=start && dt<=e; }
function sameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function addDays(d,n){ const x = new Date(d); x.setDate(d.getDate()+n); return x; }
function timeStr(slot){
  if(!slot) return 0;
  const m = slot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if(!m) return 0;
  let h = parseInt(m[1],10), min=parseInt(m[2],10), ampm=m[3].toUpperCase();
  if(ampm==="PM" && h!==12) h+=12;
  if(ampm==="AM" && h===12) h=0;
  return h*60+min;
}

/* Build week events from jobs (using job.date) */
function deriveEventsForWeek(start){
  return jobs
    .map(j => ({ ...j, _dt: parseISODate(j.date) }))
    .filter(j => isWithinWeek(j._dt, start))
    .map(j => ({
      id:j.id,
      title:j.title,
      room:j.room,
      type:j.type,
      icon: j.type==="Electrical" ? "⚡" : j.type==="Plumbing" ? "🔧" : j.type==="Internet" ? "📶" : "🧰",
      status:j.status,
      date:j._dt,
      slot:j.slot
    }))
    .sort((a,b)=> a.date-b.date || timeStr(a.slot)-timeStr(b.slot));
}

/* Render week: show up to 3, then +N more; compact chips; per-day scroll */
function renderWeek(state){
  const days = [...Array(7)].map((_,i) => addDays(state.start,i));
  const events = deriveEventsForWeek(state.start);

  calGrid.innerHTML = days.map(d => `
    <div class="cal-day" data-date="${d.toISOString()}">
      <div class="head">
        ${d.toLocaleDateString(undefined,{weekday:'short'})} ${d.getDate()}
        <span class="count"></span>
      </div>
      <div class="wrap"></div>
    </div>
  `).join("");

  const dayEls = [...calGrid.querySelectorAll(".cal-day")];
  dayEls.forEach((col) => {
    const wrap  = col.querySelector(".wrap");
    const date  = new Date(col.dataset.date);
    const dayEv = events.filter(ev => sameDay(ev.date, date));
    const countEl = col.querySelector(".count");
    countEl.textContent = dayEv.length ? `• ${dayEv.length}` : "";

    const MAX_VISIBLE = 3;
    const visible     = dayEv.slice(0, MAX_VISIBLE);
    const hiddenCount = Math.max(0, dayEv.length - MAX_VISIBLE);
    const useChips    = dayEv.length > 4;

    wrap.innerHTML = visible.map(ev =>
      useChips
        ? `<div class="cal-chip ev-${ev.status}">
             <span class="ic">${ev.icon}</span>
             <span class="txt"><strong>${ev.title}</strong> — ${ev.slot} • Rm ${ev.room}</span>
           </div>`
        : `<div class="cal-event ev-${ev.status}">
             <div class="ic">${ev.icon}</div>
             <div>
               <p class="tt">${ev.title}</p>
               <p class="meta">Room ${ev.room} • ${ev.slot} • ${ev.type}</p>
             </div>
           </div>`
    ).join("");

    if (hiddenCount > 0){
      const btn = document.createElement("button");
      btn.className = "more-btn";
      btn.textContent = `+${hiddenCount} more`;
      btn.addEventListener("click", () => openDayMore(date, dayEv));
      wrap.appendChild(btn);
    }
  });

  // Right-side "Today's Task List"
  const todayInWeek = isWithinWeek(state.today, state.start);
  if (todayInWeek){
    const todayEvents = events.filter(ev => sameDay(ev.date, state.today))
                              .sort((a,b)=> timeStr(a.slot)-timeStr(b.slot));
    calTodayList.innerHTML = todayEvents.length
      ? todayEvents.map(ev => `<li class="cal-chip"><span class="ic">${ev.icon}</span><span class="txt"><strong>${ev.title}</strong> — Room ${ev.room} • ${ev.slot}</span></li>`).join("")
      : `<li>No visits scheduled today.</li>`;
  } else {
    calTodayList.innerHTML = `<li>Today is outside this week.</li>`;
  }
}

/* =========================================================
   Performance & Ratings (demo)
   ========================================================= */
const perfModal = document.getElementById("perfModal");
const perfClose = document.getElementById("perfClose");
const perfScore = document.getElementById("perfScore");
const perfStars = document.getElementById("perfStars");
const perfList  = document.getElementById("perfList");

function openPerfModal(){
  const avg = 4.7; // demo
  perfScore.textContent = avg.toFixed(1);
  perfStars.textContent = "★★★★★".slice(0, Math.round(avg)) + "☆☆☆☆☆".slice(Math.round(avg));
  const history = [
    { id:"CMP-280", rating:5, comment:"Quick fix, thanks!", date:"10 Nov" },
    { id:"CMP-267", rating:4, comment:"Good work.",          date:"08 Nov" },
    { id:"CMP-262", rating:5, comment:"Very helpful.",       date:"06 Nov" },
  ];
  perfList.innerHTML = history.map(h => `
    <li class="perf-item">
      <span><strong>${h.id}</strong> — ${h.comment}</span>
      <span>⭐ ${h.rating} • ${h.date}</span>
    </li>
  `).join("");

  perfModal.classList.add("open");
  document.body.classList.add("modal-open");
}
function closePerfModal(){
  perfModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}
perfClose?.addEventListener("click", closePerfModal);
perfModal?.addEventListener("click", e => { if (e.target===perfModal) closePerfModal(); });
