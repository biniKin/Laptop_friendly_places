// js/dashboard.js
document.addEventListener("DOMContentLoaded", function () {
  // Initialize page
  if (!initPage()) return;

  // Initialize maps
  setTimeout(() => {
    initializeMaps();
  }, 500);

  // Load dashboard data
  loadDashboard();
  updateBadges();

  // Setup event listeners
  setupEventListeners();
});

// Load dashboard data
async function loadDashboard() {
  const places = await db.get("places");
  const reports = await db.get("reports");
  const activities = await db.get("activities");

  document.getElementById("totalPlaces").textContent = places.length;
  document.getElementById("verifiedPlaces").textContent = places.filter(
    (p) => p.status === "verified"
  ).length;
  document.getElementById("pendingPlaces").textContent = places.filter(
    (p) => p.status === "pending"
  ).length;
  document.getElementById("reportedPlaces").textContent = reports.filter(
    (r) => r.status === "pending"
  ).length;

  const activityList = document.getElementById("activityList");
  activityList.innerHTML = "";

  activities.slice(0, 4).forEach((activity) => {
    const icon =
      activity.type === "pla ce_added"
        ? "fa-map-marker-alt"
        : activity.type === "place_verified"
        ? "fa-check-circle"
        : activity.type === "report_resolved"
        ? "fa-flag"
        : "fa-bell";

    const color =
      activity.type === "place_added"
        ? "blue"
        : activity.type === "place_verified"
        ? "green"
        : activity.type === "report_resolved"
        ? "orange"
        : "red";

    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerHTML = `
      <div class="activity-icon" style="background: var(--${color});">
        <i class="fas ${icon}"></i>
      </div>
      <div class="activity-content">
        <p>${activity.message}</p>
        <div class="activity-meta">
          <span>${activity.timestamp}</span>
        </div>
      </div>
    `;
    activityList.appendChild(item);
  });
}

// Setup event listeners
function setupEventListeners() {
  // Global search
  const globalSearch = document.getElementById("globalSearch");
  if (globalSearch) {
    globalSearch.addEventListener("input", function (e) {
      const query = e.target.value;
      // Search functionality can be implemented here
    });
  }

  // Close modal when clicking outside
  window.addEventListener("click", function (e) {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  });
}

// View place details
async function viewPlace(placeId) {
  const places = await db.get("places");
  const place = places.find((p) => p.id === placeId);

  if (!place) return;

  const modalBody = document.getElementById("placeModalBody");
  const stars = getStarRating(place.rating);

  modalBody.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="${place.image}" alt="${
    place.name
  }" style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px;">
    </div>
    
    <h4 style="margin-bottom: 15px;">${place.name}</h4>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
      <div>
        <p><strong>Type:</strong> ${place.type}</p>
        <p><strong>Location:</strong> ${place.location}</p>
        <p><strong>Coordinates:</strong> ${
          place.latitude
            ? `${place.latitude.toFixed(6)}, ${place.longitude.toFixed(6)}`
            : "Not set"
        }</p>
        <p><strong>Added By:</strong> ${place.addedBy}</p>
        <p><strong>Date:</strong> ${place.addedDate}</p>
      </div>
      <div>
        <p><strong>Rating:</strong> ${stars} (${place.rating.toFixed(1)}/5)</p>
        <p><strong>WiFi Speed:</strong> ${place.wifiSpeed}</p>
        <p><strong>Power Outlets:</strong> ${place.powerOutlets}</p>
        <p><strong>Noise Level:</strong> ${place.noiseLevel}</p>
      </div>
    </div>
    
    <div>
      <strong>Description:</strong>
      <p style="margin-top: 5px; color: var(--gray-700); line-height: 1.6;">${
        place.description
      }</p>
    </div>
  `;

  document.getElementById("placeModal").style.display = "flex";
}

// Close modal
function closeModal() {
  document.getElementById("placeModal").style.display = "none";
}
