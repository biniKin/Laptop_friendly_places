// dashboard.js - SIMPLE & WORKING VERSION
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { db } from "../../js/firebase/init.js";
// Add these imports at the top of dashboard.js
import { initializeMaps, loadDashboardMap } from "./maps.js";

// Then modify the loadDashboardData function to include map loading:
async function loadDashboardData() {
  try {
    // Load all data in parallel
    const [places, reports, users] = await Promise.all([
      loadPlaces(),
      loadReports(),
      loadUsers(),
    ]);

    // Update statistics
    updateStatistics(places, reports, users);

    // Update recent activities
    updateRecentActivities(places, reports);

    // Update recent places table
    updateRecentPlaces(places);

    // Update badges
    updateBadges(places, reports);

    // Initialize and load dashboard map
    await initializeDashboardMap();
  } catch (error) {
    console.error("Error loading dashboard:", error);
    throw error;
  }
}

// Add this new function to initialize dashboard map
async function initializeDashboardMap() {
  // Check if dashboard map element exists
  if (!document.getElementById("dashboardMap")) {
    console.log("Dashboard map container not found");
    return;
  }

  // Initialize maps if not already initialized
  if (typeof window.initializeMaps === "function") {
    window.initializeMaps();

    // Wait a bit for map to initialize, then load dashboard map
    setTimeout(() => {
      if (typeof window.loadDashboardMap === "function") {
        window.loadDashboardMap();
      } else if (typeof loadDashboardMap === "function") {
        loadDashboardMap();
      }
    }, 1000);
  }
}

// Load dashboard when page loads
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Dashboard loading...");

  console.log("DOM loaded, checking for map...");

  // Wait a bit for everything to load
  setTimeout(function () {
    if (window.google && window.google.maps) {
      console.log("Google Maps API loaded, initializing dashboard map...");
      if (window.initializeMaps) {
        window.initializeMaps();

        // Load dashboard map specifically
        setTimeout(function () {
          if (window.loadDashboardMap) {
            window.loadDashboardMap();
            console.log("Dashboard map loaded");
          }
        }, 500);
      }
    } else {
      console.error("Google Maps API not loaded");
    }
  }, 1000);

  try {
    await loadDashboardData();
    console.log("Dashboard loaded successfully");
  } catch (error) {
    console.error("Dashboard error:", error);
    showToast("Failed to load dashboard data", "error");
  }
});

// Load places from Firebase
async function loadPlaces() {
  try {
    const placesRef = collection(db, "places");
    const q = query(placesRef, orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error loading places:", error);
    return [];
  }
}

// Load reports from Firebase
async function loadReports() {
  try {
    const reportsRef = collection(db, "reports");
    const snapshot = await getDocs(reportsRef);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error loading reports:", error);
    return [];
  }
}

// Load users from Firebase
async function loadUsers() {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error loading users:", error);
    return [];
  }
}

// Update statistics cards
function updateStatistics(places, reports, users) {
  // Calculate counts
  const totalPlaces = places.length;
  const verifiedPlaces = places.filter(
    (p) => p.status === "verified" || p.status === "approved"
  ).length;
  const pendingPlaces = places.filter((p) => p.status === "pending").length;
  const pendingReports = reports.filter((r) => r.status === "pending").length;
  const totalUsers = users.length;

  // Create stats grid HTML
  const statsGrid = document.getElementById("statsGrid");
  if (!statsGrid) return;

  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon places">
        <i class="fas fa-map-marker-alt"></i>
      </div>
      <div class="stat-content">
        <h3 id="totalPlaces">${totalPlaces}</h3>
        <p>Total Places</p>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon verified">
        <i class="fas fa-check-circle"></i>
      </div>
      <div class="stat-content">
        <h3 id="verifiedPlaces">${verifiedPlaces}</h3>
        <p>Verified Places</p>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon pending">
        <i class="fas fa-clock"></i>
      </div>
      <div class="stat-content">
        <h3 id="pendingPlaces">${pendingPlaces}</h3>
        <p>Pending Places</p>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon reports">
        <i class="fas fa-flag"></i>
      </div>
      <div class="stat-content">
        <h3 id="reportedPlaces">${pendingReports}</h3>
        <p>Pending Reports</p>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon users">
        <i class="fas fa-users"></i>
      </div>
      <div class="stat-content">
        <h3 id="totalUsers">${totalUsers}</h3>
        <p>Total Users</p>
      </div>
    </div>
  `;
}

// Update recent activities
function updateRecentActivities(places, reports) {
  const activityList = document.getElementById("activityList");
  if (!activityList) return;

  // Create activities from recent data
  const activities = [];

  // Add recent places (max 3)
  const recentPlaces = places.slice(0, 3);
  recentPlaces.forEach((place) => {
    const date = formatDate(place.created_at);
    activities.push({
      icon: "fas fa-map-marker-alt",
      text: `New place added: ${place.name || "Unnamed Place"}`,
      time: date,
      color: "#6366f1",
    });
  });

  // Add recent reports (max 2)
  const recentReports = reports
    .filter((r) => r.status === "pending")
    .slice(0, 2);
  recentReports.forEach((report) => {
    const date = formatDate(report.created_at);
    activities.push({
      icon: "fas fa-flag",
      text: `New report submitted`,
      time: date,
      color: "#ef4444",
    });
  });

  // If no activities
  if (activities.length === 0) {
    activityList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-bell"></i>
        <p>No recent activities</p>
      </div>
    `;
    return;
  }

  // Display activities
  activityList.innerHTML = activities
    .map(
      (activity) => `
    <div class="activity-item">
      <div class="activity-icon" style="background: ${activity.color}">
        <i class="${activity.icon}"></i>
      </div>
      <div class="activity-text">
        <p>${activity.text}</p>
        <span class="activity-time">${activity.time}</span>
      </div>
    </div>
  `
    )
    .join("");
}

// Update recent places table
function updateRecentPlaces(places) {
  const tableBody = document.getElementById("recentPlacesTable");
  if (!tableBody) return;

  // Get 5 most recent places
  const recentPlaces = places.slice(0, 5);

  if (recentPlaces.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-cell">No places added yet</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = recentPlaces
    .map((place) => {
      const date = formatDate(place.created_at);
      const statusClass =
        place.status === "verified" || place.status === "approved"
          ? "status-verified"
          : "status-pending";
      const statusText =
        place.status === "verified" || place.status === "approved"
          ? "Verified"
          : "Pending";

      return `
      <tr>
        <td><strong>${place.name || "Unnamed Place"}</strong></td>
        <td>${place.category || "N/A"}</td>
        <td>${place.rating?.overall || "N/A"}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${date}</td>
      </tr>
    `;
    })
    .join("");
}

// Update sidebar badges
function updateBadges(places, reports) {
  // Update places badge
  const placesBadge = document.getElementById("placesBadge");
  if (placesBadge) {
    placesBadge.textContent = places.length;
  }

  // Update reported badge
  const reportedBadge = document.getElementById("reportedBadge");
  if (reportedBadge) {
    const pendingReports = reports.filter((r) => r.status === "pending").length;
    reportedBadge.textContent = pendingReports;
  }
}

// Format date function
function formatDate(timestamp) {
  if (!timestamp) return "Recently";

  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "Recently";
  }
}

// Refresh button function
window.refreshDashboard = async function () {
  showToast("Refreshing data...", "info");

  try {
    await loadDashboardData();
    showToast("Dashboard refreshed!", "success");
  } catch (error) {
    showToast("Failed to refresh data", "error");
  }
};

// Toast notification function
function showToast(message, type = "info") {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
    `;
    document.body.appendChild(toastContainer);
  }

  // Create toast
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.style.cssText = `
    background: ${
      type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#6366f1"
    };
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 10px;
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

// Add CSS animations for toast
if (!document.querySelector("#toast-animations")) {
  const style = document.createElement("style");
  style.id = "toast-animations";
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// Make refresh function available globally
window.refreshData = window.refreshDashboard;
