// js/utils.js
// Toast notification function
function showToast(message, type = "info") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
  };

  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas ${icons[type] || "fa-info-circle"}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${
        type.charAt(0).toUpperCase() + type.slice(1)
      }</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 300);
  }, 5000);
}

// Update badges function
async function updateBadges() {
  const places = await db.get("places");
  const reports = await db.get("reports");

  const pendingPlaces = places.filter((p) => p.status === "pending").length;
  const placesBadge = document.getElementById("placesBadge");
  if (placesBadge) {
    placesBadge.textContent = pendingPlaces;
    placesBadge.style.display = pendingPlaces > 0 ? "inline" : "none";
  }

  const pendingReports = reports.filter((r) => r.status === "pending").length;
  const reportedBadge = document.getElementById("reportedBadge");
  if (reportedBadge) {
    reportedBadge.textContent = pendingReports;
    reportedBadge.style.display = pendingReports > 0 ? "inline" : "none";
  }
}

// Get star rating HTML
function getStarRating(rating) {
  let stars = "";
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < fullStars; i++) {
    stars += '<span class="rating-stars">★</span>';
  }

  if (hasHalfStar) {
    stars += '<span class="rating-stars">★</span>';
  }

  for (let i = stars.length; i < 5; i++) {
    stars +=
      '<span class="rating-stars" style="color: var(--gray-300);">★</span>';
  }

  return stars;
}

// Get place icon
function getPlaceIcon(type) {
  const icons = {
    cafe: "fa-coffee",
    restaurant: "fa-utensils",
    hotel: "fa-hotel",
    library: "fa-book",
    coworking: "fa-briefcase",
    other: "fa-map-marker-alt",
  };
  return icons[type] || "fa-map-marker-alt";
}

// Logout function
function logout() {
  localStorage.removeItem("adminLoggedIn");
  localStorage.removeItem("adminUsername");
  window.location.href = "login-admin.html";
}

// Toggle sidebar function
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.toggle("active");
}

// Refresh data function
function refreshData() {
  if (window.loadDashboard) loadDashboard();
  if (window.loadPlaces) loadPlaces();
  if (window.loadReports) loadReports();
  if (window.loadContributors) loadContributors();

  showToast("Data refreshed successfully!", "success");
}

// Get current page from URL
function getCurrentPage() {
  const path = window.location.pathname;
  if (path.includes("places.html")) return "places";
  if (path.includes("add-place.html")) return "add-place";
  if (path.includes("reported.html")) return "reported";
  if (path.includes("contributors.html")) return "contributors";
  return "dashboard";
}

// Set active navigation item
function setActiveNav() {
  const currentPage = getCurrentPage();
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach((item) => {
    item.classList.remove("active");

    const href = item.getAttribute("href");
    if (href) {
      if (currentPage === "dashboard" && href.includes("index.html")) {
        item.classList.add("active");
      } else if (currentPage === "places" && href.includes("places.html")) {
        item.classList.add("active");
      } else if (
        currentPage === "add-place" &&
        href.includes("add-place.html")
      ) {
        item.classList.add("active");
      } else if (currentPage === "reported" && href.includes("reported.html")) {
        item.classList.add("active");
      } else if (
        currentPage === "contributors" &&
        href.includes("contributors.html")
      ) {
        item.classList.add("active");
      }
    }
  });
}

// Initialize page
function initPage() {
  if (!localStorage.getItem("adminLoggedIn")) {
    window.location.href = "login-admin.html";
    return false;
  }

  const adminName = localStorage.getItem("adminUsername") || "Admin";
  const adminNameElement = document.getElementById("adminName");
  if (adminNameElement) {
    adminNameElement.textContent = adminName;
  }

  // Set active navigation
  setActiveNav();

  // Update page title based on current page
  const currentPage = getCurrentPage();
  const pageTitles = {
    dashboard: "Dashboard Overview",
    places: "Places Management",
    "add-place": "Add New Place",
    reported: "Reported Issues",
    contributors: "Contributors",
  };

  const pageTitleElement = document.getElementById("pageTitle");
  if (pageTitleElement && pageTitles[currentPage]) {
    pageTitleElement.textContent = pageTitles[currentPage];
  }

  // Set breadcrumb
  const breadcrumbCurrent = document.getElementById("breadcrumbCurrent");
  if (breadcrumbCurrent) {
    const breadcrumbs = {
      dashboard: "Overview",
      places: "Places",
      "add-place": "Add Place",
      reported: "Reports",
      contributors: "Contributors",
    };
    breadcrumbCurrent.textContent = breadcrumbs[currentPage] || currentPage;
  }

  // Hide loading screen
  setTimeout(() => {
    const loadingScreen = document.getElementById("loadingScreen");
    if (loadingScreen) {
      loadingScreen.style.opacity = "0";
      setTimeout(() => {
        loadingScreen.style.display = "none";
      }, 300);
    }
  }, 1000);

  return true;
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    showToast,
    updateBadges,
    getStarRating,
    getPlaceIcon,
    logout,
    toggleSidebar,
    refreshData,
    getCurrentPage,
    setActiveNav,
    initPage,
  };
}
