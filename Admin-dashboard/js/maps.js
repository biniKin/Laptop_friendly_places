// js/maps.js
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { db } from "../../js/firebase/init.js";

// At the top of maps.js, after imports

let mapsInitialized = false;
let dashboardMap = null;
let placesMap = null;
let reportedMap = null;
let adjustmentMap = null;
let adjustmentMarker = null;
let selectedCoordinates = null;
let geocoder = null;
let placesService = null;
let mapMarkers = {
  dashboard: [],
  places: [],
  reported: [],
};

// Add this after initializing placesMap in initializeMaps()
if (document.getElementById("placesMap")) {
  placesMap = new google.maps.Map(document.getElementById("placesMap"), {
    center: { lat: 9.032, lng: 38.757 },
    zoom: 12,
    // ... rest of config
  });

  // ADD TEST MARKER
  const testMarker = new google.maps.Marker({
    position: { lat: 9.032, lng: 38.757 },
    map: placesMap,
    title: "Test Marker (Addis Ababa Center)",
    icon: {
      url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      scaledSize: new google.maps.Size(32, 32),
    },
  });

  console.log("Test marker added at center");
}
// Initialize Google Maps
function initializeMaps() {
  if (!window.google || !window.google.maps) {
    console.error("Google Maps API not loaded");
    showToast(
      "Google Maps failed to load. Please check your API key.",
      "error"
    );
    return;
  }

  try {
    geocoder = new google.maps.Geocoder();
    placesService = new google.maps.places.PlacesService(
      document.createElement("div")
    );

    // Initialize Dashboard Map
    if (document.getElementById("dashboardMap")) {
      dashboardMap = new google.maps.Map(
        document.getElementById("dashboardMap"),
        {
          center: { lat: 9.032, lng: 38.757 }, // Addis Ababa center
          zoom: 12,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        }
      );
      loadDashboardMap();
    }

    // Initialize Places Map
    if (document.getElementById("placesMap")) {
      placesMap = new google.maps.Map(document.getElementById("placesMap"), {
        center: { lat: 9.032, lng: 38.757 },
        zoom: 12,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
    }

    // Initialize Reported Map
    if (document.getElementById("reportedMap")) {
      reportedMap = new google.maps.Map(
        document.getElementById("reportedMap"),
        {
          center: { lat: 9.032, lng: 38.757 },
          zoom: 12,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        }
      );
    }

    mapsInitialized = true;
    console.log("Maps initialized successfully");
  } catch (error) {
    console.error("Error initializing maps:", error);
    showToast("Failed to initialize maps", "error");
  }
}

// Load dashboard map with places
async function loadDashboardMap() {
  if (!dashboardMap) return;

  try {
    // Clear existing markers
    mapMarkers.dashboard.forEach((marker) => marker.setMap(null));
    mapMarkers.dashboard = [];

    // Load places from Firestore
    const placesCol = collection(db, "places");
    const snapshot = await getDocs(placesCol);
    const places = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Add places to map
    places.forEach((place) => {
      if (place.location && place.location._lat && place.location._long) {
        const markerColor = place.status === "approved" ? "green" : "orange";
        const markerIcon = getMarkerIcon(markerColor);

        const marker = new google.maps.Marker({
          position: {
            lat: place.location._lat,
            lng: place.location._long,
          },
          map: dashboardMap,
          title: place.name,
          icon: markerIcon,
          animation: google.maps.Animation.DROP,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: createPlaceInfoWindow(place),
          maxWidth: 300,
        });

        marker.addListener("click", () => {
          // Close all other info windows
          mapMarkers.dashboard.forEach((m) => {
            if (m.infoWindow) m.infoWindow.close();
          });
          infoWindow.open(dashboardMap, marker);
          marker.infoWindow = infoWindow;
        });

        // Add hover effect
        marker.addListener("mouseover", () => {
          marker.setIcon(getMarkerIcon(markerColor, true)); // Larger on hover
        });

        marker.addListener("mouseout", () => {
          marker.setIcon(markerIcon);
        });

        mapMarkers.dashboard.push(marker);
      }
    });

    // Adjust map bounds to show all markers
    if (places.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      let hasValidLocations = false;

      places.forEach((place) => {
        if (place.location && place.location._lat && place.location._long) {
          bounds.extend({
            lat: place.location._lat,
            lng: place.location._long,
          });
          hasValidLocations = true;
        }
      });

      if (hasValidLocations) {
        dashboardMap.fitBounds(bounds);

        // Don't zoom in too far if only one marker
        if (places.length === 1) {
          google.maps.event.addListenerOnce(
            dashboardMap,
            "bounds_changed",
            function () {
              if (this.getZoom() > 15) {
                this.setZoom(15);
              }
            }
          );
        }
      }
    }

    console.log(
      `Loaded ${mapMarkers.dashboard.length} markers on dashboard map`
    );
  } catch (error) {
    console.error("Error loading dashboard map:", error);
    showToast("Failed to load map data", "error");
  }
}

// Load places map with filtering
async function loadPlacesMap(filter = "all") {
  if (!placesMap) {
    console.error("placesmap is not initialized");
  }

  console.log("loadPlacesMap called with filter:", filter);

  if (!placesMap) {
    console.error("placesMap is not initialized!");
    return;
  }

  // ADD DEBUGGING FOR DB
  console.log("Database instance (db):", db);
  console.log("Type of db:", typeof db);

  if (!db) {
    console.log("firestore database not initialized");
    showToast("Database connection error. Pleaes refresh the page.", "error");
    return;
  }

  try {
    // Clear existing markers
    mapMarkers.places.forEach((marker) => marker.setMap(null));
    mapMarkers.places = [];

    // Load places from Firestore
    const placesCol = collection(db, "places");
    const snapshot = await getDocs(placesCol);
    let places = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply filter
    if (filter === "verified") {
      places = places.filter((p) => p.status === "approved");
    } else if (filter === "pending") {
      places = places.filter((p) => p.status === "pending");
    }

    places.forEach((place) => {
      if (place.location && place.location._lat && place.location._long) {
        const markerColor = place.status === "approved" ? "green" : "orange";
        const markerIcon = getMarkerIcon(markerColor);

        const marker = new google.maps.Marker({
          position: {
            lat: place.location._lat,
            lng: place.location._long,
          },
          map: placesMap,
          title: place.name,
          icon: markerIcon,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: createPlaceInfoWindow(place),
          maxWidth: 300,
        });

        marker.addListener("click", () => {
          infoWindow.open(placesMap, marker);
        });

        mapMarkers.places.push(marker);
      }
    });

    // Adjust map bounds to show all markers
    if (places.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      let hasValidLocations = false;

      places.forEach((place) => {
        if (place.location && place.location._lat && place.location._long) {
          bounds.extend({
            lat: place.location._lat,
            lng: place.location._long,
          });
          hasValidLocations = true;
        }
      });

      if (hasValidLocations) {
        placesMap.fitBounds(bounds);
      } else {
        // If no valid locations, reset to default
        placesMap.setCenter({ lat: 9.032, lng: 38.757 });
        placesMap.setZoom(12);
      }
    } else {
      // If no places, reset to default
      placesMap.setCenter({ lat: 9.032, lng: 38.757 });
      placesMap.setZoom(12);
    }

    console.log(
      `Loaded ${mapMarkers.places.length} markers on places map (filter: ${filter})`
    );
  } catch (error) {
    console.error("Error loading places map:", error);
    showToast("Failed to load places map", "error");
  }
}

// Load reported map (you'll need to adjust this based on your reports collection)
async function loadReportedMap(filter = "all") {
  if (!reportedMap) return;

  try {
    // Clear existing markers
    mapMarkers.reported.forEach((marker) => marker.setMap(null));
    mapMarkers.reported = [];

    // Load reports from Firestore (adjust collection name as needed)
    const reportsCol = collection(db, "reports");
    const snapshot = await getDocs(reportsCol);
    let reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply filter
    if (filter === "pending") {
      reports = reports.filter((r) => r.status === "pending");
    } else if (filter === "resolved") {
      reports = reports.filter((r) => r.status === "resolved");
    }

    reports.forEach((report) => {
      if (report.location && report.location._lat && report.location._long) {
        const markerColor = report.status === "pending" ? "red" : "green";
        const markerIcon = getMarkerIcon(markerColor);

        const marker = new google.maps.Marker({
          position: {
            lat: report.location._lat,
            lng: report.location._long,
          },
          map: reportedMap,
          title: report.placeName || "Reported Location",
          icon: markerIcon,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: createReportInfoWindow(report),
          maxWidth: 300,
        });

        marker.addListener("click", () => {
          infoWindow.open(reportedMap, marker);
        });

        mapMarkers.reported.push(marker);
      }
    });

    // Adjust map bounds
    if (reports.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      reports.forEach((report) => {
        if (report.location && report.location._lat && report.location._long) {
          bounds.extend({
            lat: report.location._lat,
            lng: report.location._long,
          });
        }
      });
      reportedMap.fitBounds(bounds);
    }

    console.log(`Loaded ${mapMarkers.reported.length} markers on reported map`);
  } catch (error) {
    console.error("Error loading reported map:", error);
    showToast("Failed to load reported issues map", "error");
  }
}

// Create place info window content
function createPlaceInfoWindow(place) {
  const stars = getStarRating(place.rating?.overall || 0);
  const statusClass =
    place.status === "approved" ? "status-verified" : "status-pending";
  const statusText = place.status === "approved" ? "Approved" : "Pending";
  const firstImage =
    place.media?.images?.[0] || "https://via.placeholder.com/100";

  return `
    <div class="custom-info-window" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 300px;">
      <div style="display: flex; align-items: center; margin-bottom: 12px; gap: 10px;">
        <img src="${firstImage}" alt="${
    place.name
  }" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
        <div>
          <div style="font-weight: 600; font-size: 16px; color: #1a1a1a; margin-bottom: 4px;">${
            place.name
          }</div>
          <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
            ${stars}
            <span style="color: #666; font-size: 14px;">(${
              place.rating?.overall || 0
            })</span>
          </div>
          <span class="status-badge" style="background: ${
            place.status === "approved" ? "#4CAF50" : "#FF9800"
          }; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
            ${statusText}
          </span>
        </div>
      </div>
      <div style="margin-bottom: 12px;">
        <p style="margin: 4px 0; font-size: 14px;"><strong>Category:</strong> ${
          place.category || "N/A"
        }</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Location:</strong> ${
          place.location
            ? `${place.location._lat.toFixed(
                6
              )}, ${place.location._long.toFixed(6)}`
            : "Not set"
        }</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>WiFi:</strong> ${
          place.rating?.wifi || "N/A"
        }</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Power:</strong> ${
          place.rating?.power || "N/A"
        }</p>
      </div>
      <div style="border-top: 1px solid #e0e0e0; padding-top: 10px;">
        <button onclick="window.viewPlace('${
          place.id
        }')" style="width: 100%; padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px;">
          View Details
        </button>
      </div>
    </div>
  `;
}

// Create report info window content
function createReportInfoWindow(report) {
  const statusClass =
    report.status === "pending" ? "status-reported" : "status-verified";
  const statusText =
    report.status === "pending" ? "Pending Review" : "Resolved";

  return `
    <div class="custom-info-window" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 300px;">
      <div style="display: flex; align-items: center; margin-bottom: 12px; gap: 10px;">
        <div style="width: 50px; height: 50px; background: #f44336; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          <i class="fas fa-flag" style="color: white; font-size: 20px;"></i>
        </div>
        <div>
          <div style="font-weight: 600; font-size: 16px; color: #1a1a1a; margin-bottom: 4px;">${
            report.placeName || "Reported Issue"
          }</div>
          <div style="color: #666; font-size: 14px;">Reported Issue</div>
          <span class="status-badge" style="background: ${
            report.status === "pending" ? "#f44336" : "#4CAF50"
          }; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
            ${statusText}
          </span>
        </div>
      </div>
      <div style="margin-bottom: 12px;">
        <p style="margin: 4px 0; font-size: 14px;"><strong>Issue Type:</strong> ${
          report.issueType || "N/A"
        }</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Reported By:</strong> ${
          report.reportedBy || "Anonymous"
        }</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Date:</strong> ${
          report.reportedDate || new Date().toLocaleDateString()
        }</p>
        ${
          report.description
            ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Description:</strong> ${report.description.substring(
                0,
                100
              )}...</p>`
            : ""
        }
      </div>
      <div style="border-top: 1px solid #e0e0e0; padding-top: 10px;">
        <button onclick="window.viewReportDetails('${
          report.id
        }')" style="width: 100%; padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px;">
          View Report
        </button>
      </div>
    </div>
  `;
}

// Map layer toggles
function toggleMapLayer(layer) {
  if (!dashboardMap) return;

  // Update toggle buttons
  document
    .querySelectorAll(".map-toggle")
    .forEach((btn) => btn.classList.remove("active"));
  event.target.closest(".map-toggle").classList.add("active");

  // Show/hide markers based on layer
  mapMarkers.dashboard.forEach((marker) => {
    const isGreen = marker.getIcon().url.includes("green");
    const isOrange = marker.getIcon().url.includes("orange");

    if (layer === "all") {
      marker.setMap(dashboardMap);
    } else if (layer === "approved") {
      marker.setMap(isGreen ? dashboardMap : null);
    } else if (layer === "pending") {
      marker.setMap(isOrange ? dashboardMap : null);
    }
  });
}

function togglePlacesMapLayer(layer) {
  console.log("togglePlacesMapLayer called with:", layer);

  // Fix the filter mapping
  const filterMap = {
    all: "all",
    verified: "approved", // Map "verified" to "approved"
    pending: "pending",
  };

  const actualFilter = filterMap[layer] || "all";
  console.log("Loading places with filter:", actualFilter);

  loadPlacesMap(actualFilter);
  loadPlacesMap(layer);

  // Update toggle buttons
  const toggles = event.target
    .closest(".map-controls")
    .querySelectorAll(".map-toggle");
  toggles.forEach((btn) => btn.classList.remove("active"));
  event.target.closest(".map-toggle").classList.add("active");
}

function toggleReportedMapLayer(layer) {
  loadReportedMap(layer);

  // Update toggle buttons
  const toggles = event.target
    .closest(".map-controls")
    .querySelectorAll(".map-toggle");
  toggles.forEach((btn) => btn.classList.remove("active"));
  event.target.closest(".map-toggle").classList.add("active");
}

// Helper function to get marker icon
function getMarkerIcon(color, hover = false) {
  const size = hover ? 40 : 32;
  const icons = {
    green: `https://maps.google.com/mapfiles/ms/icons/green-dot.png`,
    red: `https://maps.google.com/mapfiles/ms/icons/red-dot.png`,
    orange: `https://maps.google.com/mapfiles/ms/icons/orange-dot.png`,
    blue: `https://maps.google.com/mapfiles/ms/icons/blue-dot.png`,
  };

  return {
    url: icons[color] || icons.blue,
    scaledSize: new google.maps.Size(size, size),
  };
}

// Helper function to get star rating HTML
function getStarRating(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  let stars = "";
  for (let i = 0; i < fullStars; i++) {
    stars +=
      '<i class="fas fa-star" style="color: #FFD700; font-size: 12px;"></i>';
  }
  if (halfStar) {
    stars +=
      '<i class="fas fa-star-half-alt" style="color: #FFD700; font-size: 12px;"></i>';
  }
  for (let i = 0; i < emptyStars; i++) {
    stars +=
      '<i class="far fa-star" style="color: #FFD700; font-size: 12px;"></i>';
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

// Add CSS for animations if not already present
if (!document.querySelector("#map-styles")) {
  const style = document.createElement("style");
  style.id = "map-styles";
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    .custom-info-window {
      padding: 12px;
    }
  `;
  document.head.appendChild(style);
}

// Export for use in other files
window.mapsModule = {
  initializeMaps,
  loadDashboardMap,
  loadPlacesMap,
  loadReportedMap,
  toggleMapLayer,
  togglePlacesMapLayer,
  toggleReportedMapLayer,
};

// Make functions available globally for onclick handlers
window.initializeMaps = initializeMaps;
window.loadPlacesMap = loadPlacesMap;
window.loadReportedMap = loadReportedMap;
window.toggleMapLayer = toggleMapLayer;
window.togglePlacesMapLayer = togglePlacesMapLayer;
window.toggleReportedMapLayer = toggleReportedMapLayer;
