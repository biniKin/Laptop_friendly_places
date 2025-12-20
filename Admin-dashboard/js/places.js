// js/places.js
let currentFilter = "all";

document.addEventListener("DOMContentLoaded", function () {
  // Initialize page
  if (!initPage()) return;

  // Initialize maps
  setTimeout(() => {
    initializeMaps();
    loadPlacesMap("all");
  }, 500);

  // Load places data
  loadPlaces();
  updateBadges();

  // Setup event listeners
  setupEventListeners();
});

// Filter places
function filterPlaces(filter) {
  currentFilter = filter;
  document
    .querySelectorAll(".filter-btn")
    .forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");
  loadPlaces();
  loadPlacesMap(filter);
}

// Search places
function searchPlaces(query) {
  loadPlaces(query);
}

// Load places data
async function loadPlaces(searchQuery = "") {
  const places = await db.get("places");
  const table = document.getElementById("placesTable");
  const noPlaces = document.getElementById("noPlaces");

  table.innerHTML = "";

  let filteredPlaces = places;

  if (currentFilter === "verified") {
    filteredPlaces = places.filter((p) => p.status === "verified");
  } else if (currentFilter === "pending") {
    filteredPlaces = places.filter((p) => p.status === "pending");
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredPlaces = filteredPlaces.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query) ||
        p.type.toLowerCase().includes(query)
    );
  }

  document.getElementById("placesCount").textContent = filteredPlaces.length;

  if (filteredPlaces.length === 0) {
    noPlaces.style.display = "block";
    return;
  }

  noPlaces.style.display = "none";

  filteredPlaces.forEach((place) => {
    const statusClass =
      place.status === "verified" ? "status-verified" : "status-pending";
    const statusText = place.status === "verified" ? "Verified" : "Pending";
    const stars = getStarRating(place.rating);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${place.image}" alt="${place.name}" class="place-image">
          <div>
            <div style="font-weight: 600;">${place.name}</div>
            <div style="font-size: 12px; color: var(--gray-600);">${place.description.substring(
              0,
              50
            )}...</div>
          </div>
        </div>
      </td>
      <td><span style="background: var(--gray-100); padding: 4px 8px; border-radius: 6px;">${
        place.type
      }</span></td>
      <td>${place.location}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 5px;">
          ${stars}
          <span style="color: var(--gray-600); font-size: 14px;">(${place.rating.toFixed(
            1
          )})</span>
        </div>
      </td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>${place.addedDate}</td>
      <td>
        ${
          place.status === "pending"
            ? `<button class="action-btn btn-approve" onclick="approvePlace(${place.id})">
              <i class="fas fa-check"></i> Approve
            </button>`
            : ""
        }
        <button class="action-btn btn-view" onclick="viewPlace(${place.id})">
          <i class="fas fa-eye"></i>
        </button>
        <button class="action-btn btn-reject" onclick="deletePlace(${
          place.id
        })">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    table.appendChild(row);
  });
}

// Approve place
async function approvePlace(placeId) {
  const updated = await db.update("places", placeId, {
    status: "verified",
  });

  if (updated) {
    // Add activity
    const newActivity = {
      id: database.activities.length + 1,
      type: "place_verified",
      message: `Approved '${updated.name}'`,
      timestamp:
        new Date().toLocaleDateString() +
        " " +
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
    };
    database.activities.unshift(newActivity);

    showToast("Place approved successfully!", "success");
    loadPlaces();
    updateBadges();
    if (mapsInitialized) loadPlacesMap(currentFilter);
  }
}

// Delete place
async function deletePlace(placeId) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "flex";
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 400px;">
      <div class="modal-header">
        <h3>Confirm Delete</h3>
        <button class="logout-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to delete this place? This action cannot be undone.</p>
        <p style="color: var(--danger); font-weight: 600; margin-top: 10px;">This will permanently remove the place from the database.</p>
      </div>
      <div class="modal-footer">
        <button class="action-btn btn-reject" onclick="confirmDeletePlace(${placeId})">
          <i class="fas fa-trash"></i> Delete Permanently
        </button>
        <button class="logout-btn" onclick="this.parentElement.parentElement.parentElement.remove()" style="background: var(--gray-200); padding: 10px 20px; border-radius: 8px;">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener("click", function (e) {
    if (e.target === this) {
      this.remove();
    }
  });
}

// Confirm delete place
async function confirmDeletePlace(placeId) {
  const deleted = await db.delete("places", placeId);

  if (deleted) {
    showToast("Place deleted permanently from database!", "success");
    loadPlaces();
    updateBadges();
    if (mapsInitialized) {
      loadPlacesMap(currentFilter);
    }

    const modal = document.querySelector(".modal");
    if (modal) modal.remove();
  }
}

// View place details (same as dashboard.js)
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

// Setup event listeners
function setupEventListeners() {
  // Global search
  const globalSearch = document.getElementById("globalSearch");
  if (globalSearch) {
    globalSearch.addEventListener("input", function (e) {
      const query = e.target.value;
      searchPlaces(query);
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
