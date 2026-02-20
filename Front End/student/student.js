/* ===========================================================
   Student Dashboard (Fully Integrated & Fixed)
   =========================================================== */

const API_URL = "http://localhost:8080/api";
const token = localStorage.getItem("jwt_token");

// --- HELPER: Decode Token ---
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

if (!token) {
  alert("Please login first.");
  window.location.href = "../auth/index.html";
}

const userPayload = parseJwt(token);
const currentUserId = userPayload ? userPayload.sub : null;

// Global State
let myComplaintsData = [];
let notices = [];
let resaleItems = [];
let currentUserData = {};

/* ===================================================
   1. INITIAL DATA FETCH
   =================================================== */
async function initDashboard() {
  await Promise.all([
    loadProfile(),
    loadComplaints(),
    loadNotices(),
    loadResaleItems(),
  ]);

  // Render UI after data loads
  updateKPIs();
  renderRecentActivity();
  renderNotices();
}

async function loadProfile() {
  try {
    const res = await fetch(`${API_URL}/users/${currentUserId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      currentUserData = await res.json();
      document.getElementById("studentName").textContent = currentUserData.name;
      document.getElementById("year").textContent = new Date().getFullYear();

      // Load Profile Photo if exists
      if (currentUserData.profilePhoto) {
        const photoUrl = `http://localhost:8080${currentUserData.profilePhoto}`;
        const pfPhoto = document.getElementById("pfPhoto");
        if (pfPhoto) {
          pfPhoto.src = photoUrl;
          pfPhoto.style.display = "block";
          document.getElementById("pfPhotoFallback").style.display = "none";
        }
      }
    }
  } catch (e) {
    console.error("Profile Error", e);
  }
}

async function loadComplaints() {
  try {
    const res = await fetch(`${API_URL}/complaints/my-complaints`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      myComplaintsData = await res.json();
    }
  } catch (e) {
    console.error("Complaints Error", e);
  }
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

async function loadResaleItems() {
  try {
    const res = await fetch(`${API_URL}/resale`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      resaleItems = await res.json();
      renderResale(); // Update grid if open
    }
  } catch (e) {
    console.error("Resale Error", e);
  }
}

initDashboard();

/* ===================================================
   2. DASHBOARD RENDERING
   =================================================== */
function updateKPIs() {
  const pending = myComplaintsData.filter((c) =>
    ["RAISED", "IN_PROGRESS"].includes(c.status),
  ).length;
  const resolved = myComplaintsData.filter((c) =>
    ["RESOLVED", "CLOSED"].includes(c.status),
  ).length;
  document.getElementById("kpiPending").textContent = pending;
  document.getElementById("kpiResolved").textContent = resolved;
  document.getElementById("kpiResale").textContent = resaleItems.filter(
    (i) => !i.sold,
  ).length;
}

function renderRecentActivity() {
  const list = document.getElementById("activityList");
  if (!list) return;
  list.innerHTML = myComplaintsData
    .slice(-3)
    .reverse()
    .map(
      (c) => `
        <li>
            <span>Raised: ${c.category} - ${c.description.substring(
              0,
              20,
            )}...</span>
            <span style="font-weight:bold; color:var(--blue)">${c.status}</span>
        </li>
    `,
    )
    .join("");
}

function renderNotices() {
  const list = document.getElementById("noticeList");
  if (!list) return;
  list.innerHTML = notices
    .slice(0, 3)
    .map(
      (n) => `
        <li class="notice">
            <span class="date">${new Date(n.date).toLocaleDateString()}</span>
            <div>
                <p class="title">${n.title}</p>
                <p class="meta">${
                  n.postedBy || "Warden"
                } — ${n.description.substring(0, 40)}...</p>
            </div>
        </li>
    `,
    )
    .join("");
}

/* ===================================================
   3. NAVIGATION & MODALS
   =================================================== */
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("jwt_token");
  window.location.href = "../auth/index.html";
});

document
  .getElementById("profileBtn")
  ?.addEventListener("click", openProfileModal);

document.querySelectorAll(".ql-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.open;
    if (target === "raiseComplaint") openComplaintModal();
    else if (target === "myComplaints") openComplaintsModal();
    else if (target === "resaleMarket") openResaleModal();
    else if (target === "profile") openProfileModal();
  });
});

/* ===================================================
   4. COMPLAINT LOGIC (Dual Save: SQL + Blockchain)
   =================================================== */
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

lcForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    category: document.getElementById("lcType").value,
    description: document.getElementById("lcDesc").value,
    roomNumber: currentUserData.roomNumber || "N/A",
  };

  try {
    // Single call: Backend handles both SQL and Blockchain internally
    const res = await fetch(`${API_URL}/complaints`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const saved = await res.json();
      alert(
        `✅ Success!\nComplaint ID: ${saved.id}\nRecord synced to Blockchain.`,
      );
      lcForm.reset();
      closeComplaintModal();

      await loadComplaints();
      updateKPIs();
      renderRecentActivity();
    } else {
      const errorText = await res.text();
      alert("❌ Submission Failed: " + errorText);
    }
  } catch (error) {
    console.error("Submission Error:", error);
    alert("❌ Error: Could not connect to the server.");
  }
});

// My Complaints Modal
const mcModal = document.getElementById("complaintsModal");
const mcBody = document.getElementById("complaintsBody");
const mcFilter = document.getElementById("mcFilter");

function openComplaintsModal() {
  mcModal.classList.add("open");
  document.body.classList.add("modal-open");
  renderComplaintsTable(mcFilter.value || "all");
}
function closeComplaintsModal() {
  mcModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}
document
  .getElementById("mcClose")
  ?.addEventListener("click", closeComplaintsModal);

/* ===================================================
   Render Table & Verification
   =================================================== */
function renderComplaintsTable(filter = "all") {
  const filtered = myComplaintsData.filter((c) => {
    if (filter === "all") return true;
    if (filter === "pending") return c.status === "RAISED";
    if (filter === "progress")
      return c.status === "IN_PROGRESS" || c.status === "ESCALATED";
    if (filter === "resolved") return ["RESOLVED", "CLOSED"].includes(c.status);
    return true;
  });

  mcBody.innerHTML = filtered
    .map((c) => {
      let actionButtons = "";

      if (c.status === "RESOLVED") {
        actionButtons = `
          <div style="display:flex; gap:5px;">
            <button class="action-btn" onclick="openFeedbackModal('${c.id}')">Feedback</button>
            <button class="action-btn" style="background-color:#dc3545; color:white;" onclick="openEscalateModal('${c.id}')">Not Solved</button>
          </div>
        `;
      } else if (c.status === "ESCALATED") {
        actionButtons = `<span style="color:red; font-weight:bold;">Escalated</span>`;
      } else if (c.status === "CLOSED") {
        actionButtons = `<span style="color:green;">Closed</span>`;
      } else {
        // Points to verifyChain window function
        actionButtons = `<button class="action-btn" onclick="verifyChain('${c.id}')">Verify</button>`;
      }

      return `
        <tr>
            <td>${c.id}</td>
            <td>${c.category}</td>
            <td>${c.description}</td>
            <td>${new Date(c.createdAt).toLocaleDateString()}</td>
            <td style="color:var(--blue); font-weight:500;">${
              c.timeSlot || "Any Time"
            }</td>
            <td><span class="status-chip status-${c.status
              .toLowerCase()
              .replace("_", "")}">${c.status}</span></td>
            <td>${actionButtons}</td>
        </tr>
    `;
    })
    .join("");
}
mcFilter.addEventListener("change", () =>
  renderComplaintsTable(mcFilter.value),
);

window.verifyChain = async (id) => {
  try {
    // API Path: /api/complaints/{id}/verify
    const res = await fetch(`${API_URL}/complaints/${id}/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const blockchainData = await res.text();
      alert("🔗 Blockchain Record Verified:\n" + blockchainData);
    } else {
      const errorMsg = await res.text();
      alert("❌ Verification failed: " + errorMsg);
    }
  } catch (e) {
    alert("Verification failed: Connection error.");
  }
};

/* ===================================================
   5. FEEDBACK LOGIC
   =================================================== */
const fbModal = document.getElementById("feedbackModal");
const fbForm = document.getElementById("fbForm");
const fbClose = document.getElementById("fbClose");
const fbCancel = document.getElementById("fbCancel");
const fbComplaintId = document.getElementById("fbComplaintId");

window.openFeedbackModal = (id) => {
  fbComplaintId.value = id;
  fbForm.reset();
  fbModal.classList.add("open");
  document.body.classList.add("modal-open");
};

function closeFeedbackModal() {
  fbModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}
fbClose?.addEventListener("click", closeFeedbackModal);
fbCancel?.addEventListener("click", closeFeedbackModal);

fbForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = fbComplaintId.value;
  const rating = document.querySelector('input[name="rating"]:checked')?.value;
  const comment = document.getElementById("fbComment").value;
  const file = document.getElementById("fbProof").files[0];

  if (!rating || !file) {
    alert("Please provide a rating and upload a photo proof.");
    return;
  }

  const formData = new FormData();
  formData.append("rating", rating);
  formData.append("feedback", comment);
  formData.append("proof", file);

  try {
    const res = await fetch(`${API_URL}/complaints/${id}/feedback`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      alert("Feedback Submitted & Complaint Closed!");
      closeFeedbackModal();
      loadComplaints();
      updateKPIs();
    } else {
      alert("Failed: " + (await res.text()));
    }
  } catch (e) {
    console.error(e);
    alert("Server Error");
  }
});

/* ===================================================
   6. ESCALATION LOGIC
   =================================================== */
const escModal = document.getElementById("escalateModal");
const escForm = document.getElementById("escForm");
const escClose = document.getElementById("escClose");
const escCancel = document.getElementById("escCancel");
const escComplaintId = document.getElementById("escComplaintId");

window.openEscalateModal = (id) => {
  escComplaintId.value = id;
  escForm.reset();
  escModal.classList.add("open");
  document.body.classList.add("modal-open");
};

function closeEscalateModal() {
  escModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}
escClose?.addEventListener("click", closeEscalateModal);
escCancel?.addEventListener("click", closeEscalateModal);

escForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = escComplaintId.value;
  const reason = document.getElementById("escReason").value;
  const file = document.getElementById("escProof").files[0];

  if (!file) {
    alert("Proof image is required to escalate.");
    return;
  }

  const formData = new FormData();
  formData.append("reason", reason);
  formData.append("proof", file);

  try {
    const res = await fetch(`${API_URL}/complaints/${id}/reopen`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      alert("Complaint Escalated to Warden!");
      closeEscalateModal();
      loadComplaints();
      updateKPIs();
    } else {
      alert("Failed: " + (await res.text()));
    }
  } catch (e) {
    console.error(e);
    alert("Server Error");
  }
});

/* ===================================================
   7. RESALE MARKET
   =================================================== */
const resaleModal = document.getElementById("resaleModal");
const rsClose = document.getElementById("rsClose");
const rsGrid = document.getElementById("rsGrid");
const postItemModal = document.getElementById("postItemModal");
const piForm = document.getElementById("piForm");

function openResaleModal() {
  if (resaleModal) {
    resaleModal.classList.add("open");
    document.body.classList.add("modal-open");
    renderResale();
  }
}
function closeResaleModal() {
  if (resaleModal) {
    resaleModal.classList.remove("open");
    document.body.classList.remove("modal-open");
  }
}
if (rsClose) rsClose.addEventListener("click", closeResaleModal);

function renderResale() {
  const q = document.getElementById("rsSearch").value.toLowerCase();
  const cat = document.getElementById("rsCategory").value;

  let list = resaleItems.filter((it) => !it.sold);
  if (cat !== "all") list = list.filter((it) => it.category === cat);
  if (q) list = list.filter((it) => it.name.toLowerCase().includes(q));

  if (rsGrid) {
    rsGrid.innerHTML = list
      .map(
        (it) => `
            <div class="rs-card">
                <div class="rs-thumb">
                    ${
                      it.imageUrl
                        ? `<img src="http://localhost:8080${it.imageUrl}" alt="Item" style="width:100%;height:100%;object-fit:cover;">`
                        : "🪙"
                    }
                </div>
                <h4 class="rs-title">${it.name}</h4>
                <p class="rs-price">₹ ${it.price}</p>
                <p class="rs-meta">Posted by ${
                  it.ownerName || "Student"
                } • ${new Date(it.postedDate).toLocaleDateString()}</p>
                <div class="rs-actions"><button class="rs-view">Details</button></div>
            </div>
        `,
      )
      .join("");
  }
}

document.getElementById("rsSearch")?.addEventListener("input", renderResale);
document.getElementById("rsCategory")?.addEventListener("change", renderResale);

document.getElementById("rsPostBtn")?.addEventListener("click", () => {
  postItemModal.classList.add("open");
  document.body.classList.add("modal-open");
});
document.getElementById("piClose")?.addEventListener("click", () => {
  postItemModal.classList.remove("open");
  document.body.classList.remove("modal-open");
});

piForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("name", document.getElementById("piName").value);
  formData.append("price", document.getElementById("piPrice").value);
  formData.append("category", document.getElementById("piCategory").value);
  formData.append("description", document.getElementById("piDesc").value);
  formData.append("ownerName", currentUserData.name);

  const imageInput = document.getElementById("piImage");
  if (imageInput && imageInput.files[0]) {
    formData.append("image", imageInput.files[0]);
  } else {
    alert("Please upload an image for the item.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/resale`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      alert("Item Posted!");
      piForm.reset();
      postItemModal.classList.remove("open");
      document.body.classList.remove("modal-open");
      loadResaleItems();
    } else {
      const txt = await res.text();
      alert("Failed: " + txt);
    }
  } catch (e) {
    console.error(e);
  }
});

/* ===================================================
   8. NOTICES & PROFILE
   =================================================== */
const noticesModal = document.getElementById("noticesModal");
document.getElementById("viewAllNotices")?.addEventListener("click", () => {
  document.getElementById("allNoticesBody").innerHTML = notices
    .map(
      (n) => `
        <div class="notice-full-card">
            <div class="nt-title">${n.title}</div>
            <div class="nt-meta">${new Date(n.date).toLocaleDateString()} • ${
              n.postedBy || "Warden"
            }</div>
            <div class="nt-desc">${n.description}</div>
        </div>
    `,
    )
    .join("");
  noticesModal.classList.add("open");
  document.body.classList.add("modal-open");
});
document.getElementById("ntClose")?.addEventListener("click", () => {
  noticesModal.classList.remove("open");
  document.body.classList.remove("modal-open");
});

const profileModal = document.getElementById("profileModal");
const pfForm = document.getElementById("pfForm");

function openProfileModal() {
  const u = currentUserData;
  document.getElementById("pfNameLeft").textContent = u.name || "N/A";
  document.getElementById("pfFullName").value = u.name || "";
  document.getElementById("pfEmail").value = u.email || "";
  document.getElementById("pfPhone").value = u.mobile || "";
  document.getElementById("pfRoll").value = u.userId || "";

  profileModal.classList.add("open");
  document.body.classList.add("modal-open");
}
document.getElementById("pfClose")?.addEventListener("click", () => {
  profileModal.classList.remove("open");
  document.body.classList.remove("modal-open");
});

pfForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append("mobile", document.getElementById("pfPhone").value);
  try {
    const res = await fetch(`${API_URL}/users/${currentUserId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (res.ok) {
      alert("Profile Updated!");
      loadProfile();
      profileModal.classList.remove("open");
      document.body.classList.remove("modal-open");
    }
  } catch (e) {
    console.error(e);
  }
});

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.toggle("active", b === btn));
    document
      .querySelectorAll(".tab-panel")
      .forEach((p) => p.classList.toggle("active", p.id === `tab-${tab}`));
  });
});
