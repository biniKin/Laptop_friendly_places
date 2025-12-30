// js/ui.js - UI Interactions
document.addEventListener("DOMContentLoaded", function () {
  // Toggle Sidebar
  window.toggleSidebar = function () {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("collapsed");

    // Update toggle button icon
    const toggleBtn = sidebar.querySelector(".sidebar-toggle i");
    if (sidebar.classList.contains("collapsed")) {
      toggleBtn.className = "fas fa-chevron-right";
    } else {
      toggleBtn.className = "fas fa-chevron-left";
    }
  };

  // Toggle Notifications Panel
  window.toggleNotifications = function () {
    const panel = document.getElementById("notificationPanel");
    panel.classList.toggle("active");
  };

  window.closeNotifications = function () {
    document.getElementById("notificationPanel").classList.remove("active");
  };

  // Mark all notifications as read
  window.markAllAsRead = function () {
    const count = document.querySelector(".notification-count");
    count.textContent = "0";
    count.style.display = "none";
    showToast("All notifications marked as read", "success");
  };

  // View all activities
  window.viewAllActivities = function () {
    // Navigate to activities page or show modal
    showToast("Redirecting to activities page", "info");
  };

  // Generate report
  window.generateReport = function () {
    showToast("Generating report...", "info");
    setTimeout(() => {
      showToast("Report generated successfully!", "success");
    }, 1500);
  };

  // Toggle map view
  window.toggleMapView = function (view) {
    const buttons = document.querySelectorAll(".map-controls .btn");
    buttons.forEach((btn) => btn.classList.remove("active"));
    event.target.classList.add("active");

    // Call map function if available
    if (window.loadDashboardMap) {
      window.loadDashboardMap(view);
    }
  };

  // Refresh data
  window.refreshData = function () {
    showToast("Refreshing data...", "info");
    if (window.loadDashboard) {
      window.loadDashboard();
    }
  };

  // Logout
  window.logout = function () {
    if (confirm("Are you sure you want to logout?")) {
      showToast("Logging out...", "info");
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1000);
    }
  };

  // Hide loading screen when page is loaded
  window.addEventListener("load", function () {
    setTimeout(() => {
      document.getElementById("loadingScreen").style.display = "none";
    }, 800);
  });

  // Initialize event listeners
  const notificationBtn = document.getElementById("notificationBtn");
  if (notificationBtn) {
    notificationBtn.addEventListener("click", toggleNotifications);
  }

  // Close notifications when clicking outside
  document.addEventListener("click", function (e) {
    const panel = document.getElementById("notificationPanel");
    const btn = document.getElementById("notificationBtn");

    if (
      panel &&
      panel.classList.contains("active") &&
      !panel.contains(e.target) &&
      !btn.contains(e.target)
    ) {
      panel.classList.remove("active");
    }
  });
});
