import { auth, db } from "../../js/firebase/init.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

let currentFilter = "all";
let allPlaces = [];
let mapsInitialized = false;

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing maps...");
  // Initialize page
  if (!initPage()) return;

  // Initialize maps
  setTimeout(() => {
    // Check if mapsModule exists first
    if (window.mapsModule && window.mapsModule.initializeMaps) {
      window.mapsModule.initializeMaps(); // Load places map after initialization
      setTimeout(() => {
        if (window.loadPlacesMap) {
          console.log("Calling loadPlacesMap...");
          window.loadPlacesMap("all");
        }
      }, 500);
    }
    mapsInitialized = true;
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
  window.mapsModule.loadPlacesMap(filter);
}

// Search places
function searchPlaces(query) {
  loadPlaces(query);
}

// Load places data
async function loadPlaces(searchQuery = "") {
  try {
    const placesCol = collection(db, "places");
    const snapshot = await getDocs(placesCol);

    allPlaces = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log("Loaded places:", allPlaces);

    const table = document.getElementById("placesTable");
    const noPlaces = document.getElementById("noPlaces");

    table.innerHTML = "";

    let filteredPlaces = allPlaces;

    if (currentFilter === "approved") {
      filteredPlaces = filteredPlaces.filter((p) => p.status === "approved");
    } else if (currentFilter === "pending") {
      filteredPlaces = filteredPlaces.filter((p) => p.status === "pending");
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredPlaces = filteredPlaces.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.location && p.location._lat && p.location._long
            ? `${p.location._lat}, ${p.location._long}`.includes(query)
            : false) ||
          p.category.toLowerCase().includes(query)
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
        place.status === "approved" ? "status-verified" : "status-pending";
      const statusText = place.status === "approved" ? "Approved" : "Pending";
      const stars = getStarRating(place.rating?.overall || 0);
      const firstImage =
        place.media?.images?.[0] || "https://via.placeholder.com/50";
      const locationText = place.location
        ? `Lat: ${place.location._lat?.toFixed(6) || "N/A"}, Lng: ${
            place.location._long?.toFixed(6) || "N/A"
          }`
        : "Location not set";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${firstImage}" alt="${
        place.name
      }" class="place-image" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
            <div>
              <div style="font-weight: 600;">${place.name}</div>
              <div style="font-size: 12px; color: var(--gray-600);">${
                place.description?.substring(0, 50) || "No description"
              }...</div>
            </div>
          </div>
        </td>
        <td><span style="background: var(--gray-100); padding: 4px 8px; border-radius: 6px;">${
          place.category || "Uncategorized"
        }</span></td>
        <td>
          <div style="display: flex; align-items: center; gap: 5px;">
            ${stars}
            <span style="color: var(--gray-600); font-size: 14px;">(${
              place.rating?.overall || 0
            })</span>
          </div>
        </td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
          ${
            place.status === "pending"
              ? `<button class="action-btn btn-approve" onclick="approvePlace('${place.id}')">
                <i class="fas fa-check"></i> Approve
              </button>`
              : ""
          }
          <button class="action-btn btn-view" onclick="viewPlace('${
            place.id
          }')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn btn-reject" onclick="deletePlace('${
            place.id
          }')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      table.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading places:", error);
    showToast("Failed to load places", "error");
  }
}

// Approve place
async function approvePlace(placeId) {
  try {
    const placeRef = doc(db, "places", placeId);
    await updateDoc(placeRef, {
      status: "approved",
      tag: "verified",
    });

    // Find the place in our local array
    const place = allPlaces.find((p) => p.id === placeId);

    if (place) {
      // Add activity (you'll need to implement this in your database)
      // const activityRef = await addDoc(collection(db, "activities"), {
      //   type: "place_verified",
      //   message: `Approved '${place.name}'`,
      //   timestamp: new Date().toISOString(),
      //   userId: "admin" // You should get this from auth
      // });

      showToast("Place approved successfully!", "success");
      loadPlaces();
      updateBadges();
      if (mapsInitialized) loadPlacesMap(currentFilter);
    }
  } catch (error) {
    console.error("Error approving place:", error);
    showToast("Failed to approve place", "error");
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
        <button class="action-btn btn-reject" onclick="confirmDeletePlace('${placeId}')">
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
  try {
    const placeRef = doc(db, "places", placeId);
    await deleteDoc(placeRef);

    showToast("Place deleted permanently from database!", "success");
    loadPlaces();
    updateBadges();
    if (mapsInitialized) {
      loadPlacesMap(currentFilter);
    }

    const modal = document.querySelector(".modal");
    if (modal) modal.remove();
  } catch (error) {
    console.error("Error deleting place:", error);
    showToast("Failed to delete place", "error");
  }
}

// View place details
async function viewPlace(placeId) {
  try {
    const place = allPlaces.find((p) => p.id === placeId);

    if (!place) {
      showToast("Place not found", "error");
      return;
    }

    const modalBody = document.getElementById("placeModalBody");
    const stars = getStarRating(place.rating?.overall || 0);
    const firstImage =
      place.media?.images?.[0] || "https://via.placeholder.com/400x200";

    modalBody.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${firstImage}" alt="${
      place.name
    }" style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px;">
      </div>
      
      <h4 style="margin-bottom: 15px;">${place.name}</h4>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
        <div>
          <p><strong>Category:</strong> ${place.category || "N/A"}</p>
          <p><strong>Status:</strong> <span class="status-badge ${
            place.status === "approved" ? "status-verified" : "status-pending"
          }">${place.status}</span></p>
          <p><strong>Tag:</strong> ${place.tag || "N/A"}</p>
          <p><strong>Coordinates:</strong> ${
            place.location
              ? `${place.location._lat}, ${place.location._long}`
              : "Not set"
          }</p>
        </div>
        <div>
          <p><strong>Overall Rating:</strong> ${stars} (${(
      place.rating?.overall || 0
    ).toFixed(1)}/5)</p>
          <p><strong>WiFi:</strong> ${place.rating?.wifi || "N/A"}</p>
          <p><strong>Power:</strong> ${place.rating?.power || "N/A"}</p>
          <p><strong>Service:</strong> ${
            place.rating?.customer_service || "N/A"
          }</p>
        </div>
      </div>
      
      <div>
        <strong>Description:</strong>
        <p style="margin-top: 5px; color: var(--gray-700); line-height: 1.6;">${
          place.description || "No description available"
        }</p>
      </div>
      
      ${
        place.media?.images?.length > 0
          ? `
        <div style="margin-top: 20px;">
          <strong>Gallery:</strong>
          <div style="display: flex; gap: 10px; margin-top: 10px; overflow-x: auto;">
            ${place.media.images
              .map(
                (img) =>
                  `<img src="${img}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">`
              )
              .join("")}
          </div>
        </div>
      `
          : ""
      }
    `;

    document.getElementById("placeModal").style.display = "flex";
  } catch (error) {
    console.error("Error viewing place:", error);
    showToast("Failed to load place details", "error");
  }
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

// Helper function to get star rating HTML
function getStarRating(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  let stars = "";
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star" style="color: #FFD700;"></i>';
  }
  if (halfStar) {
    stars += '<i class="fas fa-star-half-alt" style="color: #FFD700;"></i>';
  }
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star" style="color: #FFD700;"></i>';
  }
  return stars;
}

// Helper function to show toast notifications
function showToast(message, type = "info") {
  // Create toast element if it doesn't exist
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    background: ${
      type === "success" ? "#4CAF50" : type === "error" ? "#f44336" : "#2196F3"
    };
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease-out;
  `;

  toast.textContent = message;
  toastContainer.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Initialize page (you need to define this function based on your needs)
function initPage() {
  // Add any initialization logic here
  return true; // Return false if initialization fails
}

// Update badges (you need to define this function based on your needs)
function updateBadges() {
  // Update badge counts based on filtered places
  const pendingCount = allPlaces.filter((p) => p.status === "pending").length;
  const approvedCount = allPlaces.filter((p) => p.status === "approved").length;

  // Update badge elements if they exist
  const pendingBadge = document.querySelector(".badge-pending");
  const approvedBadge = document.querySelector(".badge-approved");

  if (pendingBadge) pendingBadge.textContent = pendingCount;
  if (approvedBadge) approvedBadge.textContent = approvedCount;
}

window.filterPlaces = filterPlaces;
window.searchPlaces = searchPlaces;
window.viewPlace = viewPlace;
window.approvePlace = approvePlace;
window.deletePlace = deletePlace;
window.confirmDeletePlace = confirmDeletePlace;
window.closeModal = closeModal;

// Also expose loadPlaces for debugging
window.loadPlaces = loadPlaces;
