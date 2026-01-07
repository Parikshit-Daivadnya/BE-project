/* admin.js
   Updated: when removing an item from resale, prompt for a removal reason and save it on the item
   Also preserves the permission rules you asked earlier.
*/

/* ----------------- Helpers ----------------- */
const $ = id => document.getElementById(id);
const nowFmt = () => new Date().toLocaleString();

/* ---------- Current "signed-in" role (demo) ----------
   Change the role in console for testing:
     localStorage.setItem('user_role','staff')
     localStorage.setItem('user_role','warden')
     localStorage.setItem('user_role','admin')
*/
const currentRole = localStorage.getItem('user_role') || 'admin'; // default to admin

/* ---------- Demo data and persistence ---------- */
const persist = (k,v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, fallback) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
  catch(e){ return fallback; }
};

let users = load('dhcr_users', [
  { id: 'U-001', name:'Amit Kumar', email:'amit@example.com', role:'staff', active:true, block:'B-203'},
  { id: 'U-002', name:'Neha Sharma', email:'neha@example.com', role:'student', active:true, block:'A-108'},
  { id: 'U-003', name:'Warden One', email:'warden@example.com', role:'warden', active:true, block:''},
  { id: 'U-004', name:'Admin User', email:'admin@example.com', role:'admin', active:true, block:''},
]);
persist('dhcr_users', users);

let complaints = load('dhcr_complaints', [
  { id: "CMP-101", type: "Electrical", title: "Light not working", room: "B-201", slot: "10:00 AM – 12:00 PM", status: "new", staff: "" },
  { id: "CMP-102", type: "Plumbing", title: "Tap leaking", room: "A-108", slot: "02:00 PM – 04:00 PM", status: "assigned", staff: "Amit (Electrician)" },
  { id: "CMP-103", type: "Internet", title: "Wi-Fi disconnects", room: "C-310", slot: "06:00 PM – 08:00 PM", status: "progress", staff: "Karan (Network)" },
  { id: "CMP-104", type: "Electrical", title: "Faulty AC", room: "B-305", slot: "04:00 PM – 06:00 PM", status: "pendingApproval", staff: "Amit (Electrician)", proofName: "IMG-20251111.jpg" },
]);
persist('dhcr_complaints', complaints);

let resaleItems = load('dhcr_resale', [
  { id:"RS-001", name:"Study Table", price:1200, owner:"Amit (B-203)", category:"furniture", date:"2025-11-10", img:"", desc:"Solid wood", sold:false },
  { id:"RS-002", name:"Router TP-Link", price:800, owner:"Neha (A-108)", category:"electronics", date:"2025-11-09", img:"", desc:"Dual band", sold:false },
]);
persist('dhcr_resale', resaleItems);

let notices = load('dhcr_notices', [
  { id:"N-01", title:"Water Maintenance", body:"Water off 2–4 PM (Block B).", date:"11 Nov 2025" },
  { id:"N-02", title:"Pest Control", body:"Rooms 201–230 Friday 10 AM onward.", date:"10 Nov 2025" },
]);
persist('dhcr_notices', notices);

/* Save helper */
function saveAll(){
  persist('dhcr_users', users);
  persist('dhcr_complaints', complaints);
  persist('dhcr_resale', resaleItems);
  persist('dhcr_notices', notices);
}

/* ---------- Page basics ---------- */
$('yearAdmin') && ($('yearAdmin').textContent = new Date().getFullYear());
$('adminName') && ($('adminName').textContent = localStorage.getItem('admin_name') || 'Admin User');

/* ---------- Nav switching (same as Warden) ---------- */
document.querySelectorAll('.nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = btn.dataset.view;
    const viewEl = document.getElementById(`view-${view}`);
    if (viewEl) viewEl.classList.add('active');

    // Lazy render
    if (view === 'dashboard') renderDashboard();
    if (view === 'users') renderUsers();
    if (view === 'complaints') renderAdminComplaints();
    if (view === 'proofs') renderProofGridAdmin();
    if (view === 'notices') renderAdminNotices();
    if (view === 'resale') renderResaleAdmin();
  });
});

/* ---------- Dashboard ---------- */
function avgResolutionDays(){
  const resolved = complaints.filter(c=>c.status==='resolved');
  return resolved.length ? (resolved.length + Math.random()).toFixed(1) : 1.2;
}
function renderDashboard(){
  $('kpiTotalUsers') && ($('kpiTotalUsers').textContent = users.length);
  $('kpiOpenComplaints') && ($('kpiOpenComplaints').textContent = complaints.filter(c=>c.status!=='resolved').length);
  $('kpiAvgRes') && ($('kpiAvgRes').textContent = avgResolutionDays());
  $('kpiPending') && ($('kpiPending').textContent = complaints.filter(c=>c.status==='pendingApproval').length);

  // Recent admin activity (kept in dashboard for admin)
  if ($('adminRecentList')){
    const recent = [
      `${nowFmt()}: Admin signed in (demo)`,
      ...notices.slice(0,5).map(n => `${n.date}: Notice "${n.title}"`)
    ];
    $('adminRecentList').innerHTML = recent.map(r => `<li>${r}</li>`).join('');
  }
}

/* ---------- Users management ---------- */
function renderUsers(){
  const q = ($('userSearch')?.value || '').toLowerCase();
  const role = ($('userRoleFilter')?.value) || 'all';
  const rows = users.filter(u => (role === 'all' || u.role === role) && (u.name.toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q) || u.id.toLowerCase().includes(q)));
  $('usersBody').innerHTML = rows.map(u => `
    <tr>
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.email || '-'}</td>
      <td>${u.role}</td>
      <td>${u.block || '-'}</td>
      <td>${u.active ? 'Yes' : 'No'}</td>
      <td>
        <button class="btn-ghost" onclick="openEditUserAdmin('${u.id}')">Edit</button>
        <button class="btn-ghost" onclick="toggleUserActiveAdmin('${u.id}')">Toggle</button>
        <button class="btn-ghost" onclick="deleteUserAdmin('${u.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}
$('userSearch')?.addEventListener('input', renderUsers);
$('userRoleFilter')?.addEventListener('change', renderUsers);

window.openEditUserAdmin = function(id){
  const u = users.find(x=>x.id===id);
  const name = prompt('Full Name', u ? u.name : '');
  if (name === null) return;
  if (!u) {
    const newId = 'U-'+(Math.floor(Math.random()*90000)+100);
    users.unshift({ id:newId, name, email:'', role:'student', active:true, block:'' });
  } else {
    u.name = name;
  }
  saveAll(); renderUsers(); renderDashboard();
};
window.toggleUserActiveAdmin = function(id){ const i = users.findIndex(x=>x.id===id); if (i>-1) users[i].active = !users[i].active; saveAll(); renderUsers(); renderDashboard(); };
window.deleteUserAdmin = function(id){ if(!confirm('Delete user?')) return; users = users.filter(x=>x.id!==id); saveAll(); renderUsers(); renderDashboard(); };

/* ---------- Complaints (ADMIN view) ----------
   Permission rules enforced here:
   - Do NOT show Approve buttons here (only Warden approves)
   - Show "Mark Resolved" only if current role === 'staff'
*/
function renderAdminComplaints(){
  const filter = $('filterStatusAdmin')?.value || 'all';
  const list = complaints.filter(c => filter === 'all' ? true : c.status === filter);

  $('adminComplaintsBody').innerHTML = list.map(c => {
    // Action buttons: admins should only be able to view; staff can mark resolved
    let actions = `<button class="btn-ghost" onclick="openViewAdmin('${c.id}')">View</button>`;

    // Only staff may mark resolved
    if (currentRole === 'staff' && c.status !== 'resolved') {
      actions += ` <button class="btn-ghost" onclick="markResolvedAdmin('${c.id}')">Mark Resolved</button>`;
    }

    // Approve buttons are NOT shown for admin — warden handles approvals in warden UI
    return `
      <tr>
        <td>${c.id}</td>
        <td>${c.type}</td>
        <td>${c.title}</td>
        <td>${c.room}</td>
        <td>${c.slot || '-'}</td>
        <td><span class="status s-${c.status}">${c.status}</span></td>
        <td>${c.staff || '-'}</td>
        <td>${actions}</td>
      </tr>
    `;
  }).join('');
}
$('filterStatusAdmin')?.addEventListener('change', renderAdminComplaints);

window.openViewAdmin = id => {
  const c = complaints.find(x=>x.id===id);
  if (!c) return alert('Not found');
  // Show details; admin cannot approve here
  alert(`${c.id}\n${c.title}\n${c.type} — Room ${c.room}\nStatus: ${c.status}\nStaff: ${c.staff || '-'}`);
};

// Only staff may mark resolved — double-check role at runtime
window.markResolvedAdmin = function(id){
  if (currentRole !== 'staff') {
    return alert('Only staff members may mark complaints as resolved.');
  }
  const i = complaints.findIndex(c => c.id === id);
  if (i === -1) return alert('Complaint not found');
  complaints[i].status = 'resolved';
  saveAll();
  renderAdminComplaints();
  renderDashboard();
  alert(`${id} marked resolved (demo).`);
};

/* ---------- Proofs grid (admin) ----------
   Admin may view proofs, but cannot approve/reject here.
   If a non-warden opens the proof modal, the Approve/Reject controls are hidden/disabled.
*/
function renderProofGridAdmin(){
  const container = $('proofGridAdmin');
  if(!container) return;
  const items = complaints.filter(c => c.status === 'pendingApproval');
  if (!items.length) { container.innerHTML = '<p class="muted">No proofs awaiting review.</p>'; return; }

  container.innerHTML = items.map(c => `
    <button class="proof-card" onclick="openApproveAdmin('${c.id}')">
      <div class="proof-thumb">${c.proofUrl ? `<img src="${c.proofUrl}">` : ''}</div>
      <div class="proof-meta"><span class="pid">${c.id}</span><span class="ptitle">${c.title}</span><span class="pstaff">${c.staff||'—'}</span></div>
    </button>
  `).join('');
}

window.openApproveAdmin = function(id){
  const c = complaints.find(x=>x.id===id);
  if(!c) return;
  $('approveSummaryAdmin').innerHTML = `<strong>${c.id}</strong> — ${c.title}<div class="muted">${c.type} • Room ${c.room} • ${c.staff || '-'}</div>`;
  $('approvePreviewAdmin').textContent = c.proofName || (c.proofUrl ? '' : 'No image');

  // Show/hide approve controls based on role
  if (currentRole === 'warden') {
    $('approveBtnAdmin') && ($('approveBtnAdmin').style.display = '');
    $('rejectBtnAdmin') && ($('rejectBtnAdmin').style.display = '');
  } else {
    $('approveBtnAdmin') && ($('approveBtnAdmin').style.display = 'none');
    $('rejectBtnAdmin') && ($('rejectBtnAdmin').style.display = 'none');
  }

  $('approveModalAdmin')?.classList.add('open');
  document.body.classList.add('modal-open');
};

// Approve button handler (permission checked at runtime)
$('approveBtnAdmin')?.addEventListener('click', ()=>{
  if (currentRole !== 'warden') return alert('Only wardens may approve resolution proofs.');
  const text = $('approveSummaryAdmin')?.textContent || '';
  const id = text.split(' ')[0];
  const idx = complaints.findIndex(c=>c.id===id);
  if (idx > -1) { complaints[idx].status = 'resolved'; saveAll(); renderProofGridAdmin(); renderAdminComplaints(); renderDashboard(); }
  $('approveModalAdmin')?.classList.remove('open'); document.body.classList.remove('modal-open');
});

// Reject button handler (permission checked)
$('rejectBtnAdmin')?.addEventListener('click', ()=>{
  if (currentRole !== 'warden') return alert('Only wardens may reject resolution proofs.');
  const text = $('approveSummaryAdmin')?.textContent || '';
  const id = text.split(' ')[0];
  const idx = complaints.findIndex(c=>c.id===id);
  if (idx > -1) { complaints[idx].status = 'progress'; saveAll(); renderProofGridAdmin(); renderAdminComplaints(); renderDashboard(); }
  $('approveModalAdmin')?.classList.remove('open'); document.body.classList.remove('modal-open');
});

// close approve modal
$('approveCloseAdmin')?.addEventListener('click', ()=>{ $('approveModalAdmin')?.classList.remove('open'); document.body.classList.remove('modal-open'); });

/* ---------- Notices ---------- */
function renderAdminNotices(){
  if (!$('adminNoticesList')) return;
  $('adminNoticesList').innerHTML = notices.map(n => `
    <li style="margin-bottom:12px;">
      <div>
        <strong>${n.title}</strong>
        <div class="muted">${n.date}</div>
        <div>${n.body}</div>
      </div>
    </li>
  `).join('');
}
$('postNoticeBtnAdmin')?.addEventListener('click', ()=> $('noticeModalAdmin')?.classList.add('open'));
$('noticeCloseAdmin')?.addEventListener('click', ()=> $('noticeModalAdmin')?.classList.remove('open'));
$('noticeCancelAdmin')?.addEventListener('click', ()=> $('noticeModalAdmin')?.classList.remove('open'));
$('noticeFormAdmin')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const t = $('noticeTitleInputAdmin').value.trim(), b = $('noticeBodyInputAdmin').value.trim();
  if (!t || !b) return;
  notices.unshift({ id:'N-'+(Math.floor(Math.random()*90000)+100), title:t, body:b, date: new Date().toLocaleDateString() });
  saveAll(); renderAdminNotices(); renderDashboard(); $('noticeModalAdmin')?.classList.remove('open');
});

/* ---------- Resale ---------- */
function formatDate(iso){ const d = new Date(iso); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }
function renderResaleAdmin(){
  const grid = $('rsGridAdmin');
  if(!grid) return;
  const q = ($('rsSearchAdmin')?.value || '').toLowerCase();
  const cat = $('rsCategoryAdmin')?.value || 'all';
  const sort = $('rsSortAdmin')?.value || 'new';

  let list = resaleItems.filter(it=>!it.sold);
  if (cat !== 'all') list = list.filter(it => it.category === cat);
  if (q) list = list.filter(it => it.name.toLowerCase().includes(q) || (it.desc||'').toLowerCase().includes(q));

  list.sort((a,b)=>{
    if (sort === 'priceAsc') return a.price - b.price;
    if (sort === 'priceDesc') return b.price - a.price;
    return new Date(b.date) - new Date(a.date);
  });

  grid.innerHTML = list.map(it => `
    <div class="rs-card">
      <div class="rs-thumb">${it.img ? `<img src="${it.img}">` : '🖼️'}</div>
      <h4 class="rs-title">${it.name}</h4>
      <p class="rs-price">₹ ${it.price}</p>
      <p class="rs-meta">Posted by ${it.owner} • ${formatDate(it.date)}</p>
      <div style="margin-top:10px; display:flex; gap:8px;">
        <button class="btn-ghost" onclick="openResaleDetailsAdmin('${it.id}')">View Details</button>
        <button class="btn-primary" onclick="requestResaleRemovalAdmin('${it.id}')">Remove</button>
      </div>
    </div>
  `).join('');
}
$('rsSearchAdmin')?.addEventListener('input', renderResaleAdmin);
$('rsCategoryAdmin')?.addEventListener('change', renderResaleAdmin);
$('rsSortAdmin')?.addEventListener('change', renderResaleAdmin);

window.openResaleDetailsAdmin = function(id){
  const it = resaleItems.find(x=>x.id===id); if(!it) return alert('Not found');
  $('rsDetNameAdmin').textContent = it.name; $('rsDetPriceAdmin').textContent = '₹ '+it.price; $('rsDetOwnerAdmin').textContent = `Seller: ${it.owner} • Posted ${formatDate(it.date)}`; $('rsDetDescAdmin').textContent = it.desc || '—';
  if (it.img){ $('rsDetImgAdmin').src = it.img; $('rsDetImgAdmin').style.display = 'block'; } else { $('rsDetImgAdmin').style.display = 'none'; }
  $('rsDetailsModalAdmin')?.classList.add('open'); document.body.classList.add('modal-open');
};
$('rsDetCloseAdmin')?.addEventListener('click', ()=> { $('rsDetailsModalAdmin')?.classList.remove('open'); document.body.classList.remove('modal-open'); });
$('rsDetCloseBtnAdmin')?.addEventListener('click', ()=> { $('rsDetailsModalAdmin')?.classList.remove('open'); document.body.classList.remove('modal-open'); });

/*
  REQUESTED: when removing an item, ask user to submit a reason.
  Implementation:
   - requestResaleRemovalAdmin(id) will prompt for a reason (modal or prompt).
   - If the user confirms and provides a reason (or empty but confirmed), we set:
       item.sold = true
       item.removedReason = reason
       item.removedBy = currentRole (or adminName if available)
       item.removedAt = ISO timestamp
     and persist.
*/
window.requestResaleRemovalAdmin = function(id){
  const it = resaleItems.find(x=>x.id===id);
  if(!it) return alert('Item not found');

  // Ask whether to remove — first confirm
  const want = confirm(`Remove "${it.name}" from resale listings? Click OK to proceed and enter a reason next.`);
  if(!want) return;

  // Prompt user for the reason (simple and immediate). If you prefer a nicer modal, we can add it.
  let reason = prompt('Please enter reason for removing this item (optional):', '');
  // user pressed Cancel -> stop removal
  if (reason === null) {
    // user cancelled prompt
    return alert('Removal cancelled.');
  }

  // Save removal metadata and mark as removed/sold
  it.sold = true;
  it.removedReason = reason.trim();
  it.removedBy = localStorage.getItem('admin_name') || currentRole || 'admin';
  it.removedAt = new Date().toISOString();

  saveAll();
  renderResaleAdmin();
  renderDashboard();

  // Optional: show a short summary including reason
  const summary = `Item "${it.name}" removed.\nRemoved by: ${it.removedBy}\nTime: ${new Date(it.removedAt).toLocaleString()}\nReason: ${it.removedReason || '(none)'}`;
  alert(summary);
};

function markResaleRemovedAdmin(id){ // legacy support (calls requestResaleRemovalAdmin)
  requestResaleRemovalAdmin(id);
}

function markResaleRemovedAdminNoPrompt(id, byUser = null, reasonText = '') {
  // Internal helper to mark removed without prompt (used only if needed).
  const i = resaleItems.findIndex(x=>x.id===id);
  if(i === -1) return;
  resaleItems[i].sold = true;
  resaleItems[i].removedReason = reasonText || '';
  resaleItems[i].removedBy = byUser || (localStorage.getItem('admin_name') || currentRole || 'admin');
  resaleItems[i].removedAt = new Date().toISOString();
  saveAll();
  renderResaleAdmin();
  renderDashboard();
}

function markResaleRemovedAdminLegacy(id){
  // kept in case other code calls old function name
  requestResaleRemovalAdmin(id);
}

/* Post Item modal logic */
$('rsPostBtnAdmin')?.addEventListener('click', ()=> $('postItemModalAdmin')?.classList.add('open'));
$('piCloseAdmin')?.addEventListener('click', ()=> $('postItemModalAdmin')?.classList.remove('open'));
$('piResetAdmin')?.addEventListener('click', ()=> $('piFormAdmin')?.reset());
$('piFormAdmin')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = $('piNameAdmin').value.trim();
  const price = parseInt($('piPriceAdmin').value||'0',10);
  const category = $('piCategoryAdmin').value;
  const desc = $('piDescAdmin').value.trim();
  const file = $('piImgAdmin').files && $('piImgAdmin').files[0];
  const newItem = { id:'RS-'+(Math.floor(Math.random()*90000)+100), name, price, category, desc, owner:'Admin • Institute', date: new Date().toISOString().slice(0,10), img: file ? URL.createObjectURL(file) : '', sold:false };
  resaleItems.unshift(newItem); saveAll(); renderResaleAdmin(); $('postItemModalAdmin')?.classList.remove('open');
});

/* ---------- Topbar actions ---------- */
$('logoutBtn')?.addEventListener('click', ()=> location.href = '../auth/index.html');
$('notifBtn')?.addEventListener('click', ()=> alert('No new notifications.'));
$('profileBtn')?.addEventListener('click', ()=> alert('Admin profile (demo).'));

/* ---------- Initial render ---------- */
renderDashboard();
renderUsers();
renderAdminComplaints();
renderAdminNotices();
renderResaleAdmin();
renderProofGridAdmin();
