/**
 * X-WEB Control Panel — Application Logic
 * =========================================
 * Firebase Auth + Firestore + Storage integration
 */

// ─── FIREBASE CONFIG ────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBYhf2q_bsS1pcUvLZNoiLBSvWCKB6VWog",
  authDomain: "x-web-ar-platform.firebaseapp.com",
  projectId: "x-web-ar-platform",
  storageBucket: "x-web-ar-platform.firebasestorage.app",
  messagingSenderId: "795991549233",
  appId: "1:795991549233:web:741ac6e74bac19266f3c10",
  databaseURL: "https://x-web-ar-platform-default-rtdb.firebaseio.com",
  measurementId: "G-YCM9SQ738P"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ─── STATE ──────────────────────────────────────────────────────
let currentUser = null;
let experiences = [];

// ─── AUTH (disabled — no login required) ────────────────────────
// Skip login, go straight to dashboard
function init() {
  document.getElementById("login-screen").classList.remove("active");
  document.getElementById("app-screen").classList.add("active");
  loadExperiences();
}
init();

// ─── NAVIGATION ─────────────────────────────────────────────────
window.switchView = function(viewName) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(`view-${viewName}`).classList.add("active");

  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.querySelector(`.nav-item[data-view="${viewName}"]`).classList.add("active");
};

// ─── LOAD EXPERIENCES ───────────────────────────────────────────
async function loadExperiences() {
  try {
    const snapshot = await db.collection("experiences").orderBy("createdAt", "desc").get();
    experiences = [];
    snapshot.forEach(doc => {
      experiences.push({ id: doc.id, ...doc.data() });
    });
    renderDashboard();
    renderExperiencesList();
  } catch (err) {
    console.error("Error loading experiences:", err);
  }
}

function renderDashboard() {
  const total = experiences.length;
  const image = experiences.filter(e => e.type === "image-target").length;
  const world = experiences.filter(e => e.type === "world-target").length;
  const comms = experiences.filter(e => e.type === "comms-ar").length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-image").textContent = image;
  document.getElementById("stat-world").textContent = world;
  document.getElementById("stat-comms").textContent = comms;

  const recentList = document.getElementById("recent-list");
  if (experiences.length === 0) {
    recentList.innerHTML = '<p class="empty-state">No experiences yet. Create your first one.</p>';
    return;
  }

  recentList.innerHTML = experiences.slice(0, 5).map(exp => renderExperienceItem(exp)).join("");
}

function renderExperiencesList(filter = "all") {
  const list = document.getElementById("experiences-list");
  const filtered = filter === "all" ? experiences : experiences.filter(e => e.type === filter);

  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-state">No experiences found.</p>';
    return;
  }

  list.innerHTML = filtered.map(exp => renderExperienceItem(exp)).join("");
}

function renderExperienceItem(exp) {
  const typeLabels = {
    "image-target": "IMAGE",
    "world-target": "GPS",
    "comms-ar": "COMMS"
  };
  const url = exp.siteId ? `https://${exp.siteId}.web.app` : "#";

  return `
    <div class="experience-item">
      <div class="exp-info">
        <span class="exp-type-badge">${typeLabels[exp.type] || exp.type}</span>
        <div>
          <div class="exp-name">${exp.name || "Untitled"}</div>
          <div class="exp-channel">${exp.channel || ""}</div>
        </div>
      </div>
      <div class="exp-actions">
        <a href="${url}" target="_blank">View</a>
        <button onclick="deleteExperience('${exp.id}')">Delete</button>
      </div>
    </div>
  `;
}

// ─── FILTER ─────────────────────────────────────────────────────
window.filterExperiences = function(filter) {
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(`.filter-btn[data-filter="${filter}"]`).classList.add("active");
  renderExperiencesList(filter);
};

// ─── CREATE EXPERIENCE ──────────────────────────────────────────

// Type selector logic
document.querySelectorAll(".type-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".type-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");

    const type = card.dataset.type;
    document.getElementById("section-image-target").classList.toggle("hidden", type !== "image-target");
    document.getElementById("section-world-target").classList.toggle("hidden", type !== "world-target");
    document.getElementById("section-comms-ar").classList.toggle("hidden", type !== "comms-ar");
  });
});

// Site ID preview
document.getElementById("field-site-id").addEventListener("input", (e) => {
  const val = e.target.value || "___";
  document.getElementById("url-preview").textContent = val;
});

window.handleCreate = async function(event) {
  event.preventDefault();

  const type = document.querySelector('input[name="type"]:checked').value;
  const name = document.getElementById("field-name").value;
  const channel = document.getElementById("field-channel").value;
  const siteId = document.getElementById("field-site-id").value;

  if (!name || !siteId) {
    alert("Please fill in the App Name and Site ID.");
    return;
  }

  const experience = {
    type,
    name,
    channel,
    siteId,
    status: "draft",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdBy: "admin",
  };

  // Add type-specific fields
  if (type === "image-target") {
    experience.targetData = document.getElementById("field-target-data").value || null;
  } else if (type === "world-target") {
    experience.latitude = parseFloat(document.getElementById("field-lat").value) || null;
    experience.longitude = parseFloat(document.getElementById("field-lng").value) || null;
    experience.radius = parseInt(document.getElementById("field-radius").value) || 50;
  } else if (type === "comms-ar") {
    experience.phone = document.getElementById("field-phone").value || null;
    experience.callLabel = document.getElementById("field-call-label").value || null;
    experience.password = document.getElementById("field-password").value || "gerald";
  }

  try {
    // Upload files to Firebase Storage if provided
    const fileUploads = [];

    if (type === "image-target") {
      const targetImage = document.getElementById("field-target-image").files[0];
      const contentMedia = document.getElementById("field-content-media").files[0];

      if (targetImage) {
        const ref = storage.ref(`xweb-assets/${siteId}/target-image/${targetImage.name}`);
        const snap = await ref.put(targetImage);
        experience.targetImageUrl = await snap.ref.getDownloadURL();
      }
      if (contentMedia) {
        const ref = storage.ref(`xweb-assets/${siteId}/content/${contentMedia.name}`);
        const snap = await ref.put(contentMedia);
        experience.contentUrl = await snap.ref.getDownloadURL();
      }
    } else if (type === "world-target") {
      const model = document.getElementById("field-model").files[0];
      if (model) {
        const ref = storage.ref(`xweb-assets/${siteId}/models/${model.name}`);
        const snap = await ref.put(model);
        experience.modelUrl = await snap.ref.getDownloadURL();
      }
    } else if (type === "comms-ar") {
      const commsImage = document.getElementById("field-comms-image").files[0];
      if (commsImage) {
        const ref = storage.ref(`xweb-assets/${siteId}/target-image/${commsImage.name}`);
        const snap = await ref.put(commsImage);
        experience.targetImageUrl = await snap.ref.getDownloadURL();
      }
    }

    // Save to Firestore
    await db.collection("experiences").add(experience);

    alert(`Experience "${name}" created successfully!\n\nSite ID: ${siteId}\nURL: https://${siteId}.web.app\n\nNote: A Manus agent will need to generate the image target data and deploy the site.`);

    // Reset form and go to experiences view
    document.getElementById("create-form").reset();
    switchView("experiences");
    loadExperiences();

  } catch (err) {
    console.error("Error creating experience:", err);
    alert("Error: " + err.message);
  }
};

// ─── DELETE EXPERIENCE ──────────────────────────────────────────
window.deleteExperience = async function(id) {
  if (!confirm("Are you sure you want to delete this experience?")) return;

  try {
    await db.collection("experiences").doc(id).delete();
    loadExperiences();
  } catch (err) {
    console.error("Error deleting:", err);
    alert("Error: " + err.message);
  }
};


