// js/contributors.js - SIMPLE WORKING VERSION
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { db } from "../../js/firebase/init.js";

document.addEventListener("DOMContentLoaded", async function () {
  console.log("Contributors page loading...");
  await loadContributors();
  setupEventListeners();
});

async function loadContributors() {
  try {
    console.log("Loading contributors...");

    // Get all users
    const usersCol = collection(db, "users");
    const usersSnapshot = await getDocs(usersCol);

    const table = document.getElementById("contributorsTable");
    const noContributors = document.getElementById("noContributors");

    if (!table) {
      console.error("Table element not found!");
      return;
    }

    table.innerHTML = "";

    if (usersSnapshot.empty) {
      if (noContributors) noContributors.style.display = "block";
      console.log("No contributors found");
      return;
    }

    if (noContributors) noContributors.style.display = "none";

    // Get all contributions
    const contributionsCol = collection(db, "contributions");
    const contributionsSnapshot = await getDocs(contributionsCol);
    const contributions = {};

    contributionsSnapshot.docs.forEach((contribDoc) => {
      const data = contribDoc.data();
      const userId = data.contributor_id || data.user_id;

      if (userId && !contributions[userId]) {
        contributions[userId] = [];
      }

      if (userId) {
        contributions[userId].push({
          id: contribDoc.id,
          ...data,
        });
      }
    });

    // Display each user
    usersSnapshot.forEach((userDoc) => {
      const user = userDoc.data();
      const userId = userDoc.id;

      // Get user's contributions
      const userContributions = contributions[userId] || [];
      const totalContributions = userContributions.length;

      // Get unique place IDs from contributions
      const placeIds = [];
      userContributions.forEach((contrib) => {
        if (contrib.place_ids) {
          if (Array.isArray(contrib.place_ids)) {
            placeIds.push(...contrib.place_ids);
          } else {
            placeIds.push(contrib.place_ids);
          }
        } else if (contrib.place_id) {
          placeIds.push(contrib.place_id);
        }
      });

      // Remove duplicates
      const uniquePlaceIds = [...new Set(placeIds)];
      const totalPlaces = uniquePlaceIds.length;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <strong>${user.name || "No name"}</strong><br>
          <small style="color: #666;">ID: ${userId.substring(0, 8)}...</small>
        </td>
        <td>${user.email || "No email"}</td>
        <td>
          <strong>${totalContributions}</strong><br>
          <small style="color: #666;">contributions</small>
        </td>
        <td>
          <strong>${totalPlaces}</strong><br>
          <small style="color: #666;">places</small>
        </td>
        <td>
          <div style="display: flex; gap: 5px;">
            <button class="action-btn btn-view" onclick="viewContributor('${userId}')" title="View">
              <i class="fas fa-eye"></i>
            </button>
            <button class="action-btn btn-delete" onclick="deleteContributor('${userId}')" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      table.appendChild(row);
    });

    console.log(`Loaded ${usersSnapshot.size} contributors`);
  } catch (error) {
    console.error("Error loading contributors:", error);
    alert("Failed to load contributors. Check console for details.");
  }
}

// View contributor details
async function viewContributor(userId) {
  try {
    // Get user
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("User not found");
      return;
    }

    const user = userSnap.data();

    // Get user's contributions
    const contributionsCol = collection(db, "contributions");
    const q = query(contributionsCol, where("contributor_id", "==", userId));
    const contributionsSnapshot = await getDocs(q);

    const userContributions = [];
    contributionsSnapshot.forEach((contribDoc) => {
      userContributions.push({
        id: contribDoc.id,
        ...contribDoc.data(),
      });
    });

    // Create modal
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

    // Build contributions list HTML
    let contributionsHTML = "<p>No contributions found</p>";
    if (userContributions.length > 0) {
      contributionsHTML = "";
      userContributions.forEach((contrib, index) => {
        contributionsHTML += `
          <div style="padding: 10px; background: #f5f5f5; border-radius: 5px; margin-bottom: 10px;">
            <strong>Contribution ${index + 1}:</strong> ${
          contrib.type || "Unknown"
        }<br>
            <small>Place IDs: ${
              contrib.place_ids || contrib.place_id || "None"
            }</small><br>
            <small>Status: ${contrib.status || "Unknown"}</small>
          </div>
        `;
      });
    }

    modal.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 10px; width: 500px; max-width: 90%; max-height: 80vh; overflow-y: auto;">
        <h3 style="margin-top: 0;">Contributor Details</h3>
        
        <div style="margin-bottom: 20px;">
          <strong>Name:</strong> ${user.name || "No name"}<br>
          <strong>Email:</strong> ${user.email || "No email"}<br>
          <strong>User ID:</strong> ${userId}<br>
          <strong>Total Contributions:</strong> ${userContributions.length}<br>
          <strong>Total Places:</strong> ${
            new Set(
              userContributions.flatMap((c) =>
                c.place_ids
                  ? Array.isArray(c.place_ids)
                    ? c.place_ids
                    : [c.place_ids]
                  : c.place_id
                  ? [c.place_id]
                  : []
              )
            ).size
          }
        </div>
        
        <div style="margin-bottom: 20px;">
          <strong>Contributions:</strong>
          <div style="margin-top: 10px; max-height: 300px; overflow-y: auto;">
            ${contributionsHTML}
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
    console.error("Error viewing contributor:", error);
    alert("Failed to load contributor details");
  }
}

// Delete contributor
async function deleteContributor(userId) {
  if (!confirm("Delete this contributor and all their contributions?")) return;

  try {
    // First, delete user's contributions
    const contributionsCol = collection(db, "contributions");
    const q = query(contributionsCol, where("contributor_id", "==", userId));
    const contributionsSnapshot = await getDocs(q);

    const deletePromises = [];
    contributionsSnapshot.forEach((contribDoc) => {
      deletePromises.push(deleteDoc(doc(db, "contributions", contribDoc.id)));
    });

    // Wait for all contributions to be deleted
    await Promise.all(deletePromises);

    // Then delete the user
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);

    // Reload the contributors list
    await loadContributors();
    alert("Contributor deleted successfully!");
  } catch (error) {
    console.error("Error deleting contributor:", error);
    alert("Failed to delete contributor");
  }
}

// Setup event listeners
function setupEventListeners() {
  // Search functionality
  const searchInput = document.getElementById("globalSearch");
  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      const query = e.target.value.toLowerCase();
      const rows = document.querySelectorAll("#contributorsTable tr");

      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? "" : "none";
      });
    });
  }

  // Refresh button
  const refreshBtn = document.querySelector('button[onclick*="refresh"]');
  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadContributors);
  }
}

// Make functions global
window.viewContributor = viewContributor;
window.deleteContributor = deleteContributor;
window.loadContributors = loadContributors;
