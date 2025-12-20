// js/maps.js
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

// Initialize Google Maps
function initializeMaps() {
  if (!window.google || !window.google.maps) {
    console.error("Google Maps API not loaded");
    return;
  }

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
    });
  }

  // Initialize Reported Map
  if (document.getElementById("reportedMap")) {
    reportedMap = new google.maps.Map(document.getElementById("reportedMap"), {
      center: { lat: 9.032, lng: 38.757 },
      zoom: 12,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });
  }

  mapsInitialized = true;
}

// Load dashboard map with places and reports
function loadDashboardMap() {
  if (!dashboardMap) return;

  // Clear existing markers
  mapMarkers.dashboard.forEach((marker) => marker.setMap(null));
  mapMarkers.dashboard = [];

  // Load places and reports
  Promise.all([db.get("places"), db.get("reports")]).then(
    ([places, reports]) => {
      // Add regular places with coffee icon
      places.forEach((place) => {
        if (place.latitude && place.longitude) {
          const marker = new google.maps.Marker({
            position: { lat: place.latitude, lng: place.longitude },
            map: dashboardMap,
            title: place.name,
            icon: {
              url: "https://maps.google.com/mapfiles/ms/icons/coffee.png",
              scaledSize: new google.maps.Size(32, 32),
            },
          });

          const infoWindow = new google.maps.InfoWindow({
            content: createPlaceInfoWindow(place),
          });

          marker.addListener("click", () => {
            infoWindow.open(dashboardMap, marker);
          });

          mapMarkers.dashboard.push(marker);
        }
      });

      // Add reported places with red flag icon
      reports
        .filter((r) => r.status === "pending")
        .forEach((report) => {
          if (report.latitude && report.longitude) {
            const marker = new google.maps.Marker({
              position: { lat: report.latitude, lng: report.longitude },
              map: dashboardMap,
              title: `Reported: ${report.placeName}`,
              icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                scaledSize: new google.maps.Size(32, 32),
              },
            });

            const infoWindow = new google.maps.InfoWindow({
              content: createReportInfoWindow(report),
            });

            marker.addListener("click", () => {
              infoWindow.open(dashboardMap, marker);
            });

            mapMarkers.dashboard.push(marker);
          }
        });
    }
  );
}

// Load places map with filtering
function loadPlacesMap(filter = "all") {
  if (!placesMap) return;

  // Clear existing markers
  mapMarkers.places.forEach((marker) => marker.setMap(null));
  mapMarkers.places = [];

  db.get("places").then((places) => {
    let filteredPlaces = places;

    if (filter === "verified") {
      filteredPlaces = places.filter((p) => p.status === "verified");
    } else if (filter === "pending") {
      filteredPlaces = places.filter((p) => p.status === "pending");
    }

    filteredPlaces.forEach((place) => {
      if (place.latitude && place.longitude) {
        const markerColor = place.status === "verified" ? "green" : "orange";
        const marker = new google.maps.Marker({
          position: { lat: place.latitude, lng: place.longitude },
          map: placesMap,
          title: place.name,
          icon: {
            url: `https://maps.google.com/mapfiles/ms/icons/${markerColor}-dot.png`,
            scaledSize: new google.maps.Size(32, 32),
          },
        });

        const infoWindow = new google.maps.InfoWindow({
          content: createPlaceInfoWindow(place),
        });

        marker.addListener("click", () => {
          infoWindow.open(placesMap, marker);
        });

        mapMarkers.places.push(marker);
      }
    });

    // Adjust map bounds to show all markers
    if (filteredPlaces.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      filteredPlaces.forEach((place) => {
        if (place.latitude && place.longitude) {
          bounds.extend({ lat: place.latitude, lng: place.longitude });
        }
      });
      placesMap.fitBounds(bounds);
    }
  });
}

// Load reported map with filtering
function loadReportedMap(filter = "all") {
  if (!reportedMap) return;

  // Clear existing markers
  mapMarkers.reported.forEach((marker) => marker.setMap(null));
  mapMarkers.reported = [];

  db.get("reports").then((reports) => {
    let filteredReports = reports;

    if (filter === "pending") {
      filteredReports = reports.filter((r) => r.status === "pending");
    } else if (filter === "resolved") {
      filteredReports = reports.filter((r) => r.status === "resolved");
    }

    filteredReports.forEach((report) => {
      if (report.latitude && report.longitude) {
        const markerColor = report.status === "pending" ? "red" : "green";
        const marker = new google.maps.Marker({
          position: { lat: report.latitude, lng: report.longitude },
          map: reportedMap,
          title: report.placeName,
          icon: {
            url: `https://maps.google.com/mapfiles/ms/icons/${markerColor}-dot.png`,
            scaledSize: new google.maps.Size(32, 32),
          },
        });

        const infoWindow = new google.maps.InfoWindow({
          content: createReportInfoWindow(report),
        });

        marker.addListener("click", () => {
          infoWindow.open(reportedMap, marker);
        });

        mapMarkers.reported.push(marker);
      }
    });

    // Adjust map bounds to show all markers
    if (filteredReports.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      filteredReports.forEach((report) => {
        if (report.latitude && report.longitude) {
          bounds.extend({ lat: report.latitude, lng: report.longitude });
        }
      });
      reportedMap.fitBounds(bounds);
    }
  });
}

// Create place info window content
function createPlaceInfoWindow(place) {
  const stars = getStarRating(place.rating);
  const statusClass =
    place.status === "verified" ? "status-verified" : "status-pending";
  const statusText = place.status === "verified" ? "Verified" : "Pending";

  return `
    <div class="custom-info-window">
      <div class="info-window-header">
        <div class="info-window-icon" style="background: var(--primary);">
          <i class="fas ${getPlaceIcon(place.type)}"></i>
        </div>
        <div>
          <div class="info-window-title">${place.name}</div>
          <div class="info-window-rating">${stars} (${place.rating.toFixed(
    1
  )})</div>
        </div>
      </div>
      <p><strong>Type:</strong> ${place.type}</p>
      <p><strong>Location:</strong> ${place.location}</p>
      <p><strong>WiFi:</strong> ${place.wifiSpeed}</p>
      <p><strong>Outlets:</strong> ${place.powerOutlets}</p>
      <span class="info-window-status ${statusClass}">${statusText}</span>
      <div style="margin-top: 10px;">
        <button onclick="viewPlace(${
          place.id
        })" style="padding: 5px 10px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">
          View Details
        </button>
      </div>
    </div>
  `;
}

// Create report info window content
function createReportInfoWindow(report) {
  const statusClass =
    report.status === "pending"
      ? "status-reported"
      : report.status === "resolved"
      ? "status-verified"
      : "status-rejected";
  const statusText =
    report.status === "pending"
      ? "Pending Review"
      : report.status === "resolved"
      ? "Resolved"
      : "Rejected";

  return `
    <div class="custom-info-window">
      <div class="info-window-header">
        <div class="info-window-icon" style="background: var(--danger);">
          <i class="fas fa-flag"></i>
        </div>
        <div>
          <div class="info-window-title">${report.placeName}</div>
          <div style="color: var(--gray-600); font-size: 14px;">Reported Issue</div>
        </div>
      </div>
      <p><strong>Issue Type:</strong> ${report.issueType}</p>
      <p><strong>Reported By:</strong> ${report.reportedBy}</p>
      <p><strong>Date:</strong> ${report.reportedDate}</p>
      <span class="info-window-status ${statusClass}">${statusText}</span>
      <div style="margin-top: 10px;">
        <button onclick="viewReportDetails(${report.id})" style="padding: 5px 10px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">
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
    const isRegular = marker.getIcon().url.includes("coffee.png");
    const isReported = marker.getIcon().url.includes("red-dot.png");

    if (layer === "all") {
      marker.setMap(dashboardMap);
    } else if (layer === "reported") {
      marker.setMap(isReported ? dashboardMap : null);
    }
  });
}

function togglePlacesMapLayer(layer) {
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

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    initializeMaps,
    loadDashboardMap,
    loadPlacesMap,
    loadReportedMap,
    toggleMapLayer,
    togglePlacesMapLayer,
    toggleReportedMapLayer,
  };
}
