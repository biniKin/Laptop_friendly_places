// maps.js - SIMPLE WORKING VERSION
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { db } from "../../js/firebase/init.js";

let dashboardMap = null;
let markers = [];

// Initialize map when page loads
document.addEventListener("DOMContentLoaded", function () {
  console.log("Maps module loading...");

  // Wait a bit for Google Maps API to load
  setTimeout(() => {
    if (typeof google !== "undefined" && google.maps) {
      initMap();
    } else {
      console.error("Google Maps API not loaded");
      showToast("Maps failed to load. Please refresh the page.", "error");
    }
  }, 1000);
});

// Initialize the map
function initMap() {
  const mapElement = document.getElementById("dashboardMap");

  if (!mapElement) {
    console.error("Map element not found!");
    return;
  }

  try {
    console.log("Initializing map...");

    // Create the map
    dashboardMap = new google.maps.Map(mapElement, {
      center: { lat: 9.032, lng: 38.757 }, // Addis Ababa
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    console.log("Map initialized successfully");

    // Load places on the map
    loadPlacesOnMap();

    // Add a simple test marker
    addTestMarker();
  } catch (error) {
    console.error("Error initializing map:", error);
    showToast("Failed to initialize map", "error");
  }
}

// Add a test marker to verify map works
function addTestMarker() {
  if (!dashboardMap) return;

  const testMarker = new google.maps.Marker({
    position: { lat: 9.032, lng: 38.757 },
    map: dashboardMap,
    title: "Test Marker - Addis Ababa Center",
    icon: {
      url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      scaledSize: new google.maps.Size(32, 32),
    },
  });

  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div style="padding: 10px; max-width: 200px;">
        <h4 style="margin: 0 0 10px 0; color: #2196F3;">Test Location</h4>
        <p>Addis Ababa Center</p>
        <p><strong>Coordinates:</strong><br>9.032, 38.757</p>
      </div>
    `,
  });

  testMarker.addListener("click", () => {
    infoWindow.open(dashboardMap, testMarker);
  });

  markers.push(testMarker);
  console.log("Test marker added");
}

// Load places from Firebase and add to map
async function loadPlacesOnMap() {
  if (!dashboardMap) {
    console.error("Map not initialized");
    return;
  }

  try {
    console.log("Loading places for map...");

    // Get all places from Firebase
    const placesRef = collection(db, "places");
    const snapshot = await getDocs(placesRef);
    const places = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Found ${places.length} places to display on map`);

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));
    markers = [];

    // Add each place as a marker
    places.forEach((place) => {
      if (
        place.location &&
        place.location.latitude &&
        place.location.longitude
      ) {
        addPlaceMarker(place);
      }
    });

    // Fit map bounds to show all markers
    if (markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((marker) => bounds.extend(marker.getPosition()));
      dashboardMap.fitBounds(bounds);

      // Don't zoom too close if only one marker
      if (markers.length === 1) {
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
  } catch (error) {
    console.error("Error loading places for map:", error);
  }
}

// Add a single place marker to the map
function addPlaceMarker(place) {
  if (!dashboardMap) return;

  // Choose marker color based on status
  let markerColor = "blue";
  if (place.status === "pending") markerColor = "orange";
  if (place.status === "reported") markerColor = "red";
  if (place.status === "approved" || place.status === "verified")
    markerColor = "green";

  const marker = new google.maps.Marker({
    position: {
      lat: place.location.latitude,
      lng: place.location.longitude,
    },
    map: dashboardMap,
    title: place.name || "Unnamed Place",
    icon: {
      url: `http://maps.google.com/mapfiles/ms/icons/${markerColor}-dot.png`,
      scaledSize: new google.maps.Size(32, 32),
    },
  });

  // Create info window content
  const infoContent = `
    <div style="padding: 15px; max-width: 250px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
      <h4 style="margin: 0 0 10px 0; color: #2196F3;">${
        place.name || "Unnamed Place"
      }</h4>
      <p><strong>Status:</strong> ${place.status || "Unknown"}</p>
      <p><strong>Category:</strong> ${place.category || "N/A"}</p>
      <p><strong>Rating:</strong> ${place.rating?.overall || "N/A"}/5</p>
      <button onclick="viewPlaceOnMap('${place.id}')" 
              style="width: 100%; padding: 8px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">
        View Details
      </button>
    </div>
  `;

  const infoWindow = new google.maps.InfoWindow({
    content: infoContent,
  });

  // Show info window on click
  marker.addListener("click", () => {
    infoWindow.open(dashboardMap, marker);
  });

  markers.push(marker);
}

// Toggle map layers (simple version)
window.toggleMapLayer = function (layer) {
  if (!dashboardMap || markers.length === 0) return;

  console.log(`Toggling map layer: ${layer}`);

  // Update toggle buttons
  const toggles = document.querySelectorAll(".map-toggle");
  toggles.forEach((toggle) => toggle.classList.remove("active"));
  event.target.closest(".map-toggle").classList.add("active");

  // Show/hide markers based on layer
  markers.forEach((marker) => {
    const isBlue = marker.getIcon().url.includes("blue");
    const isRed = marker.getIcon().url.includes("red");

    if (layer === "all") {
      marker.setMap(dashboardMap);
    } else if (layer === "reported") {
      marker.setMap(isRed ? dashboardMap : null);
    }
  });
};

// View place details from map
window.viewPlaceOnMap = function (placeId) {
  console.log("View place:", placeId);
  showToast(`Viewing place ${placeId}`, "info");
  // You can implement modal opening here
};

// Show toast notification
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${
      type === "success" ? "#4CAF50" : type === "error" ? "#f44336" : "#2196F3"
    };
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;

  toast.textContent = message;
  document.body.appendChild(toast);

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

// Make functions globally available
window.initMap = initMap;
window.loadPlacesOnMap = loadPlacesOnMap;
