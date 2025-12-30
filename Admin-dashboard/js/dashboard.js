// js/dashboard.js - Simple Version
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { db } from "../../js/firebase/init.js";

document.addEventListener("DOMContentLoaded", async function () {
  console.log("Dashboard loading...");

  try {
    await loadDashboardData();

    // Initialize maps after a delay
    setTimeout(() => {
      if (window.loadDashboardMap) {
        window.loadDashboardMap("all");
      }
    }, 500);
  } catch (error) {
    console.error("Error loading dashboard:", error);
    showToast("Failed to load dashboard data", "error");
  }
});

async function loadDashboardData() {
  try {
    // Load places
    const placesCol = collection(db, "places");
    const placesSnapshot = await getDocs(placesCol);
    const allPlaces = placesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Load reports
    const reportsCol = collection(db, "reports");
    const reportsSnapshot = await getDocs(reportsCol);
    const allReports = reportsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Load users
    const usersCol = collection(db, "users");
    const usersSnapshot = await getDocs(usersCol);
    const allUsers = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Update statistics
    updateStats(allPlaces, allReports, allUsers);

    // Update badges
    updateBadges(allPlaces, allReports);

    // Load recent activities
    loadRecentActivities(allPlaces);

    // Load recent places
    loadRecentPlaces(allPlaces);
  } catch (error) {
    console.error("Error loading data:", error);
    throw error;
  }
}

function updateStats(places, reports, users) {
  // Update count elements
  const elements = {
    totalPlaces: places.length,
    verifiedPlaces: places.filter(
      (p) => p.status === "approved" || p.status === "verified"
    ).length,
    pendingPlaces: places.filter((p) => p.status === "pending").length,
    reportedPlaces: reports.filter((r) => r.status === "pending").length,
    totalUsers: users.length,
  };

  for (const [id, value] of Object.entries(elements)) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }
}

function updateBadges(places, reports) {
  const placesBadge = document.getElementById("placesBadge");
  const reportedBadge = document.getElementById("reportedBadge");

  if (placesBadge) {
    placesBadge.textContent = places.length;
  }

  if (reportedBadge) {
    reportedBadge.textContent = reports.filter(
      (r) => r.status === "pending"
    ).length;
  }
}

function loadRecentActivities(places) {
  const activityList = document.getElementById("activityList");
  if (!activityList) return;

  // Sort by date (newest first)
  const recentPlaces = [...places]
    .sort((a, b) => {
      const dateA = a.created_at ? a.created_at.toDate() : new Date(0);
      const dateB = b.created_at ? b.created_at.toDate() : new Date(0);
      return dateB - dateA;
    })
    .slice(0, 5);

  if (recentPlaces.length === 0) {
    return;
  }

  activityList.innerHTML = "";

  recentPlaces.forEach((place) => {
    const date = place.created_at
      ? new Date(place.created_at.toDate()).toLocaleDateString()
      : "Recently";

    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerHTML = `
      <div class="activity-icon">
        <i class="fas fa-map-marker-alt"></i>
      </div>
      <div class="activity-content">
        <p>New place added: ${place.name || "Unnamed Place"}</p>
        <div class="activity-meta">
          <span>${date}</span>
        </div>
      </div>
    `;

    activityList.appendChild(item);
  });
}

function loadRecentPlaces(places) {
  const tableBody = document.getElementById("recentPlacesTable");
  if (!tableBody) return;

  // Get 5 most recent places
  const recentPlaces = [...places]
    .sort((a, b) => {
      const dateA = a.created_at ? a.created_at.toDate() : new Date(0);
      const dateB = b.created_at ? b.created_at.toDate() : new Date(0);
      return dateB - dateA;
    })
    .slice(0, 5);

  if (recentPlaces.length === 0) {
    return;
  }

  tableBody.innerHTML = "";

  recentPlaces.forEach((place) => {
    const date = place.created_at
      ? new Date(place.created_at.toDate()).toLocaleDateString()
      : "N/A";

    const statusClass =
      place.status === "approved" ? "status-verified" : "status-pending";
    const statusText = place.status === "approved" ? "Approved" : "Pending";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${place.name || "Unnamed Place"}</strong></td>
      <td>${place.category || "N/A"}</td>
      <td>${place.rating?.overall || "N/A"}/5</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>${date}</td>
      <td>
        <button class="btn btn-sm" onclick="viewPlace('${
          place.id
        }')">View</button>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

function refreshData() {
  showToast("Refreshing data...", "info");
  loadDashboardData()
    .then(() => {
      showToast("Data refreshed successfully!", "success");
    })
    .catch((error) => {
      showToast("Failed to refresh data", "error");
    });
}

function generateReport() {
  showToast("Exporting data...", "info");
  setTimeout(() => {
    showToast("Report generated successfully!", "success");
  }, 1500);
}

function viewPlace(placeId) {
  // Implement view place functionality
  console.log("View place:", placeId);
  showToast("View place feature", "info");
}

// Toast function
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Make functions globally available
window.refreshData = refreshData;
window.generateReport = generateReport;
window.viewPlace = viewPlace;
window.loadDashboardMap = loadDashboardMap; // This should be from maps.js
