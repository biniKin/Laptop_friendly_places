// js/reported.js
let currentReportId = null;

document.addEventListener("DOMContentLoaded", function () {
  // Initialize page
  if (!initPage()) return;

  // Initialize maps
  setTimeout(() => {
    initializeMaps();
    loadReportedMap("all");
  }, 500);

  // Load reports data
  loadReports();
  updateBadges();

  // Setup event listeners
  setupEventListeners();
});

// Load reports data
async function loadReports() {
  const reports = await db.get("reports");
  const table = document.getElementById("reportedTable");
  const noReports = document.getElementById("noReports");

  table.innerHTML = "";

  if (reports.length === 0) {
    noReports.style.display = "block";
    return;
  }

  noReports.style.display = "none";

  reports.forEach((report) => {
    const statusClass =
      report.status === "resolved"
        ? "status-verified"
        : report.status === "rejected"
        ? "status-rejected"
        : "status-reported";
    const statusText =
      report.status === "resolved"
        ? "Resolved"
        : report.status === "rejected"
        ? "Rejected"
        : "Pending";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${report.placeName}</strong></td>
      <td><span style="background: var(--gray-100); padding: 4px 8px; border-radius: 6px;">${
        report.issueType
      }</span></td>
      <td>${report.reportedBy}</td>
      <td>
        ${
          report.image
            ? `<img src="${report.image}" alt="Proof" style="width: 80px; height: 60px; object-fit: cover; border-radius: 6px; cursor: pointer;" onclick="viewReportImage('${report.image}', '${report.placeName}')">`
            : '<span style="color: var(--gray-500);">No image</span>'
        }
      </td>
      <td>${report.reportedDate}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>
        <button class="action-btn btn-view" onclick="viewReportDetails(${
          report.id
        })">
          <i class="fas fa-eye"></i> View
        </button>
        ${
          report.status === "pending"
            ? `<button class="action-btn btn-approve" onclick="approveReport(${report.id})">
                <i class="fas fa-check"></i>
              </button>
              <button class="action-btn btn-reject" onclick="rejectReport(${report.id})">
                <i class="fas fa-times"></i>
              </button>`
            : ""
        }
        <button class="action-btn btn-reject" onclick="deleteReport(${
          report.id
        })">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    table.appendChild(row);
  });
}

// View report image
function viewReportImage(imageUrl, placeName) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "flex";
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h3>Proof Image - ${placeName}</h3>
        <button class="logout-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>
      </div>
      <div class="modal-body" style="text-align: center;">
        <img src="${imageUrl}" alt="Proof" style="width: 100%; border-radius: 10px;">
        <p style="margin-top: 15px; color: var(--gray-600);">Image uploaded by user as proof</p>
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

// View report details
async function viewReportDetails(reportId) {
  const reports = await db.get("reports");
  const report = reports.find((r) => r.id === reportId);

  if (!report) return;

  currentReportId = reportId;

  const modalBody = document.getElementById("reportModalBody");
  modalBody.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h4 style="color: var(--primary);">${report.placeName}</h4>
      <p><strong>Issue Type:</strong> ${report.issueType}</p>
      <p><strong>Reported By:</strong> ${report.reportedBy}</p>
      <p><strong>Reported On:</strong> ${report.reportedDate}</p>
      ${
        report.latitude
          ? `<p><strong>Coordinates:</strong> ${report.latitude.toFixed(
              6
            )}, ${report.longitude.toFixed(6)}</p>`
          : ""
      }
    </div>
    
    <div style="margin-bottom: 20px;">
      <strong>Description:</strong>
      <p style="margin-top: 5px; padding: 15px; background: var(--gray-100); border-radius: 8px; color: var(--gray-700);">
        ${report.description}
      </p>
    </div>
    
    ${
      report.image
        ? `
      <div style="margin-bottom: 20px;">
        <strong>Proof Image:</strong>
        <div style="text-align: center; margin-top: 10px;">
          <img src="${report.image}" alt="Proof" class="report-image">
        </div>
      </div>
    `
        : ""
    }
    
    <div style="background: var(--gray-100); padding: 15px; border-radius: 8px;">
      <strong>Current Status:</strong>
      <span class="status-badge ${
        report.status === "pending"
          ? "status-reported"
          : report.status === "resolved"
          ? "status-verified"
          : "status-rejected"
      }" style="margin-left: 10px;">
        ${
          report.status === "pending"
            ? "Pending Review"
            : report.status === "resolved"
            ? "Resolved"
            : "Rejected"
        }
      </span>
    </div>
  `;

  document.getElementById("reportModal").style.display = "flex";
}

// Approve report
async function approveReport(reportId = null) {
  const id = reportId || currentReportId;
  if (!id) return;

  const updated = await db.update("reports", id, { status: "resolved" });

  if (updated) {
    // Add activity
    const newActivity = {
      id: database.activities.length + 1,
      type: "report_resolved",
      message: `Approved report for '${updated.placeName}'`,
      timestamp:
        new Date().toLocaleDateString() +
        " " +
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
    };
    database.activities.unshift(newActivity);

    showToast("Report approved and marked as resolved!", "success");
    loadReports();
    updateBadges();
    if (mapsInitialized) loadReportedMap("all");
    closeReportModal();
  }
}

// Reject report
async function rejectReport(reportId = null) {
  const id = reportId || currentReportId;
  if (!id) return;

  // When admin rejects a report, remove it from the database
  const deleted = await db.delete("reports", id);

  if (deleted) {
    showToast("Report has been rejected and removed!", "success");
    loadReports();
    updateBadges();
    if (mapsInitialized) loadReportedMap("all");
    closeReportModal();
  }
}

// Delete report
async function deleteReport(reportId) {
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
        <p>Are you sure you want to delete this report? This action cannot be undone.</p>
        <p style="color: var(--danger); font-weight: 600; margin-top: 10px;">This will permanently remove the report from the database.</p>
      </div>
      <div class="modal-footer">
        <button class="action-btn btn-reject" onclick="confirmDeleteReport(${reportId})">
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

// Confirm delete report
async function confirmDeleteReport(reportId) {
  const deleted = await db.delete("reports", reportId);

  if (deleted) {
    showToast("Report deleted permanently from database!", "success");
    loadReports();
    updateBadges();
    if (mapsInitialized) loadReportedMap("all");

    const modal = document.querySelector(".modal");
    if (modal) modal.remove();
  }
}

// Close report modal
function closeReportModal() {
  document.getElementById("reportModal").style.display = "none";
  currentReportId = null;
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
        currentReportId = null;
      }
    });
  });
}
