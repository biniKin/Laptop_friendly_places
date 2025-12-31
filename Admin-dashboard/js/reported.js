// js/reported.js - SIMPLE WORKING VERSION
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { db } from "../../js/firebase/init.js";

let currentReportId = null;

// Initialize when page loads
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Reports page loading...");
  await loadReports();
  setupEventListeners();
});

// Load reports - SIMPLE VERSION
async function loadReports() {
  try {
    console.log("Loading reports...");

    // Get all reports
    const reportsCol = collection(db, "reports");
    const q = query(reportsCol, orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);

    const table = document.getElementById("reportedTable");
    const noReports = document.getElementById("noReports");

    if (!table) {
      console.error("Table element not found!");
      return;
    }

    table.innerHTML = "";

    if (snapshot.empty) {
      if (noReports) noReports.style.display = "block";
      console.log("No reports found");
      return;
    }

    if (noReports) noReports.style.display = "none";

    // Get all places for reference
    const placesCol = collection(db, "places");
    const placesSnapshot = await getDocs(placesCol);
    const places = {};

    placesSnapshot.docs.forEach((placeDoc) => {
      places[placeDoc.id] = placeDoc.data().name || "Unknown Place";
    });

    // Get all users for reference
    const usersCol = collection(db, "users");
    const usersSnapshot = await getDocs(usersCol);
    const users = {};

    usersSnapshot.docs.forEach((userDoc) => {
      users[userDoc.id] = userDoc.data().name || "Anonymous";
    });

    // Display each report
    snapshot.forEach((docSnap) => {
      const report = docSnap.data();
      const reportId = docSnap.id;

      // Get place name
      const placeName = places[report.place_id] || "Unknown Place";

      // Get user name
      const userName = users[report.reported_by] || "Anonymous";

      // Format date
      const reportDate = report.created_at
        ? new Date(report.created_at.toDate()).toLocaleDateString()
        : "N/A";

      // Status color
      let statusClass = "status-reported";
      let statusText = "Pending";

      if (report.status === "resolved") {
        statusClass = "status-verified";
        statusText = "Resolved";
      } else if (report.status === "rejected") {
        statusClass = "status-rejected";
        statusText = "Rejected";
      }

      const row = document.createElement("tr");
      row.innerHTML = `
        <td><strong>${placeName}</strong></td>
        <td>${report.reason || "No reason"}</td>
        <td>${userName}</td>
        <td>${
          report.message
            ? report.message.substring(0, 30) + "..."
            : "No message"
        }</td>
        <td>${reportDate}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
          <button class="action-btn btn-view" onclick="viewReport('${reportId}')">
            <i class="fas fa-eye"></i>
          </button>
          ${
            report.status === "pending"
              ? `
            <button class="action-btn btn-approve" onclick="approveReport('${reportId}')">
              <i class="fas fa-check"></i>
            </button>
            <button class="action-btn btn-reject" onclick="rejectReport('${reportId}')">
              <i class="fas fa-times"></i>
            </button>
          `
              : ""
          }
          <button class="action-btn btn-delete" onclick="deleteReport('${reportId}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      table.appendChild(row);
    });

    console.log(`Loaded ${snapshot.size} reports`);
  } catch (error) {
    console.error("Error loading reports:", error);
    alert("Failed to load reports. Check console for details.");
  }
}

// View report - SIMPLE MODAL
async function viewReport(reportId) {
  try {
    // Get the report
    const reportsCol = collection(db, "reports");
    const snapshot = await getDocs(reportsCol);
    let report = null;
    let reportDocId = null;

    snapshot.forEach((docSnap) => {
      if (docSnap.id === reportId) {
        report = docSnap.data();
        reportDocId = docSnap.id;
      }
    });

    if (!report) {
      alert("Report not found");
      return;
    }

    // Get place name
    let placeName = "Unknown Place";
    if (report.place_id) {
      try {
        const placeRef = doc(db, "places", report.place_id);
        const placeSnap = await getDoc(placeRef);
        if (placeSnap.exists()) {
          placeName = placeSnap.data().name || "Unknown Place";
        }
      } catch (e) {
        console.log("Could not fetch place:", e);
      }
    }

    // Get user name
    let userName = "Anonymous";
    if (report.reported_by) {
      try {
        const userRef = doc(db, "users", report.reported_by);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          userName = userSnap.data().name || "Anonymous";
        }
      } catch (e) {
        console.log("Could not fetch user:", e);
      }
    }

    // Create simple modal
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 10px; width: 500px; max-width: 90%;">
        <h3 style="margin-top: 0;">Report Details</h3>
        
        <div style="margin-bottom: 15px;">
          <strong>Place:</strong> ${placeName}<br>
          <strong>Reported by:</strong> ${userName}<br>
          <strong>Reason:</strong> ${report.reason || "N/A"}<br>
          <strong>Date:</strong> ${
            report.created_at
              ? new Date(report.created_at.toDate()).toLocaleString()
              : "N/A"
          }<br>
          <strong>Status:</strong> ${report.status || "pending"}
        </div>
        
        <div style="margin-bottom: 20px;">
          <strong>Message:</strong><br>
          <div style="padding: 10px; background: #f5f5f5; border-radius: 5px; margin-top: 5px;">
            ${report.message || "No message provided"}
          </div>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" 
                  style="padding: 8px 16px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Close
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close when clicking outside
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        this.remove();
      }
    });
  } catch (error) {
    console.error("Error viewing report:", error);
    alert("Failed to load report details");
  }
}

// Approve report - SIMPLE VERSION
async function approveReport(reportId) {
  if (!confirm("Approve this report?")) return;

  try {
    const reportRef = doc(db, "reports", reportId);
    await updateDoc(reportRef, {
      status: "resolved",
      resolved_at: new Date(),
    });

    // Reload the reports
    await loadReports();
    alert("Report approved!");
  } catch (error) {
    console.error("Error approving report:", error);
    alert("Failed to approve report");
  }
}

// Reject report - SIMPLE VERSION
async function rejectReport(reportId) {
  if (!confirm("Reject this report?")) return;

  try {
    const reportRef = doc(db, "reports", reportId);
    await updateDoc(reportRef, {
      status: "rejected",
      rejected_at: new Date(),
    });

    // Reload the reports
    await loadReports();
    alert("Report rejected!");
  } catch (error) {
    console.error("Error rejecting report:", error);
    alert("Failed to reject report");
  }
}

// Delete report - SIMPLE VERSION
async function deleteReport(reportId) {
  if (!confirm("Delete this report permanently?")) return;

  try {
    const reportRef = doc(db, "reports", reportId);
    await deleteDoc(reportRef);

    // Reload the reports
    await loadReports();
    alert("Report deleted!");
  } catch (error) {
    console.error("Error deleting report:", error);
    alert("Failed to delete report");
  }
}

// Setup event listeners
function setupEventListeners() {
  // Search functionality
  const searchInput = document.getElementById("globalSearch");
  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      const query = e.target.value.toLowerCase();
      const rows = document.querySelectorAll("#reportedTable tr");

      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? "" : "none";
      });
    });
  }

  // Filter buttons
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const filter = this.textContent.toLowerCase();
      filterReports(filter);
    });
  });
}

// Filter reports - SIMPLE VERSION
function filterReports(filter) {
  const rows = document.querySelectorAll("#reportedTable tr");

  rows.forEach((row) => {
    const statusCell = row.querySelector(".status-badge");
    if (!statusCell) return;

    const statusText = statusCell.textContent.toLowerCase();

    if (filter === "all" || filter === "" || statusText.includes(filter)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });

  // Update active button
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");
}

// Make functions global
window.viewReport = viewReport;
window.approveReport = approveReport;
window.rejectReport = rejectReport;
window.deleteReport = deleteReport;
window.filterReports = filterReports;
