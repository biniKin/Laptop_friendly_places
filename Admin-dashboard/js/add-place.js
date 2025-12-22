// js/add-place.js - COMPLETE REWRITTEN VERSION
import {
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { db } from "../../js/firebase/init.js";

// Global variables
let selectedCoordinates = null;
let geocoder = null;
let placesService = null;
let adjustmentMap = null;
let adjustmentMarker = null;
let auth = null;

document.addEventListener("DOMContentLoaded", function () {
  console.log("Add Place page loaded");

  // Initialize Google Maps services
  if (window.google && window.google.maps) {
    geocoder = new google.maps.Geocoder();
    placesService = new google.maps.places.PlacesService(
      document.createElement("div")
    );
    console.log("Google Maps services initialized");
  } else {
    console.error("Google Maps not loaded");
  }

  // Setup event listeners
  setupEventListeners();

  // Hide loading screen
  const loadingScreen = document.getElementById("loadingScreen");
  if (loadingScreen) {
    loadingScreen.style.display = "none";
  }
});

// Setup event listeners
function setupEventListeners() {
  console.log("Setting up event listeners...");

  // Rating stars interaction
  document.querySelectorAll(".rating-input .stars").forEach((star) => {
    star.addEventListener("click", function () {
      const value = parseInt(this.getAttribute("data-value"));
      document.getElementById("ratingValue").textContent = value + ".0";
      document.getElementById("rating").value = value + ".0";

      document.querySelectorAll(".rating-input .stars").forEach((s, index) => {
        if (index < value) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });
    });
  });

  // Initialize rating stars to 3
  document.querySelectorAll(".rating-input .stars").forEach((star, index) => {
    if (index < 3) {
      star.classList.add("active");
    }
  });

  // Add place form submission
  const addPlaceForm = document.getElementById("addPlaceForm");
  if (addPlaceForm) {
    addPlaceForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      console.log("Form submitted");

      await handleAddPlace();
    });
  } else {
    console.error("Add Place form not found!");
  }

  // Search button click
  const searchBtn = document.getElementById("searchLocationBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", searchPlaceLocation);
  }

  // Confirm location button
  const confirmBtn = document.getElementById("confirmLocationBtn");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", confirmLocationSelection);
  }

  // Adjust location button
  const adjustBtn = document.getElementById("adjustLocationBtn");
  if (adjustBtn) {
    adjustBtn.addEventListener("click", openMapForLocationAdjustment);
  }

  // Click outside location results
  document.addEventListener("click", function (e) {
    const results = document.getElementById("locationResults");
    if (results && !e.target.closest(".location-search-container")) {
      results.style.display = "none";
    }
  });

  // Global search
  const globalSearch = document.getElementById("globalSearch");
  if (globalSearch) {
    globalSearch.addEventListener("input", function (e) {
      const query = e.target.value;
      console.log("Searching:", query);
    });
  }
}

// Handle adding a place
async function handleAddPlace() {
  console.log("Handling add place...");

  // Validate location coordinates
  const lat = parseFloat(document.getElementById("latitude").value);
  const lng = parseFloat(document.getElementById("longitude").value);

  if (!lat || !lng) {
    showToast("Please select a location on the map first", "error");
    return;
  }

  // Get form values
  const name = document.getElementById("placeName").value.trim();
  const category = document.getElementById("placeType").value;
  const address = document.getElementById("location").value.trim();
  const description = document.getElementById("description").value.trim();
  const overallRating =
    parseFloat(document.getElementById("rating").value) || 3.0;
  const wifiSpeed = document.getElementById("wifiSpeed").value;

  // Get the image file
  const imageFileInput = document.getElementById("imageFile");
  let imageFile = null;
  if (imageFileInput && imageFileInput.files.length > 0) {
    imageFile = imageFileInput.files[0];
  }

  // Validate required fields
  if (!name) {
    showToast("Please enter a place name", "error");
    return;
  }

  if (!category) {
    showToast("Please select a place category", "error");
    return;
  }

  if (!address) {
    showToast("Please enter a location address", "error");
    return;
  }

  if (!description) {
    showToast("Please enter a description", "error");
    return;
  }

  if (!imageFile) {
    showToast("Please select an image file", "error");
    return;
  }

  // Validate file type
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!allowedTypes.includes(imageFile.type)) {
    showToast(
      "Please select a valid image file (JPEG, PNG, GIF, WebP)",
      "error"
    );
    return;
  }

  // Validate file size (max 5MB)
  if (imageFile.size > 5 * 1024 * 1024) {
    showToast("Image file size should be less than 5MB", "error");
    return;
  }

  // Prepare place data according to your schema
  const placeData = {
    name: name,
    category: category,
    description: description,
    location: {
      _lat: lat,
      _long: lng,
    },
    status: "approved", // Admin added places are automatically approved
    tag: "popular", // Default tag
    rating: {
      overall: overallRating,
      wifi: wifiSpeed,
      power: "good", // Default value
      comfort: "good", // Default value
      customer_service: "good", // Default value
      noise: "good", // Default value
    },
    addedDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  try {
    console.log("Preparing to add place to Firestore:", placeData);

    // First, handle image upload
    console.log("Processing image file:", imageFile.name);

    // For now, we'll create a data URL for the image
    // In a real app, you'd upload to Firebase Storage
    const imageDataURL = await readFileAsDataURL(imageFile);

    // Add image to media object
    placeData.media = {
      images: [imageDataURL], // Store as data URL for now
      videos: [],
    };

    // Add to Firestore
    const placesRef = collection(db, "places");
    const docRef = await addDoc(placesRef, placeData);

    console.log("Place added with ID:", docRef.id);

    showToast(
      `Place "${name}" added successfully! It is automatically approved.`,
      "success"
    );

    // Reset form
    resetForm();

    // Redirect to places page after 2 seconds
    setTimeout(() => {
      window.location.href = "places.html";
    }, 2000);
  } catch (error) {
    console.error("Error adding place:", error);
    showToast("Failed to add place. Please try again.", "error");
  }
}

// Helper function to read file as data URL
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Search place location using Google Places API
function searchPlaceLocation() {
  console.log("Searching place location...");

  const query = document.getElementById("placeNameSearch").value.trim();
  if (!query) {
    showToast("Please enter a place name to search", "error");
    return;
  }

  const resultsContainer = document.getElementById("locationResults");
  if (!resultsContainer) {
    console.error("Location results container not found");
    return;
  }

  resultsContainer.innerHTML =
    '<div style="padding: 20px; text-align: center; color: #666;">Searching...</div>';
  resultsContainer.style.display = "block";

  // Check if placesService is available
  if (!placesService) {
    showToast("Maps service not available. Please refresh the page.", "error");
    return;
  }

  // Use Google Places API to search for the place
  const request = {
    query: query,
    fields: ["name", "geometry", "formatted_address", "place_id"],
  };

  placesService.textSearch(request, (results, status) => {
    resultsContainer.innerHTML = "";

    if (
      status === google.maps.places.PlacesServiceStatus.OK &&
      results.length > 0
    ) {
      console.log("Found places:", results.length);

      results.slice(0, 5).forEach((place, index) => {
        const item = document.createElement("div");
        item.className = "location-result-item";
        item.innerHTML = `
          <strong>${place.name}</strong><br>
          <small>${place.formatted_address}</small>
        `;
        item.onclick = () => selectLocation(place);
        resultsContainer.appendChild(item);
      });
    } else {
      console.warn("No places found or error:", status);
      resultsContainer.innerHTML =
        '<div style="padding: 20px; text-align: center; color: var(--danger);">No locations found. Try a different search term.</div>';
    }
  });
}

// Select location from search results
function selectLocation(place) {
  console.log("Location selected:", place.name);

  const selectedLocation = document.getElementById("selectedLocation");
  const locationName = document.getElementById("selectedLocationName");
  const coordinates = document.getElementById("selectedCoordinates");

  if (!selectedLocation || !locationName || !coordinates) {
    console.error("Location display elements not found");
    return;
  }

  locationName.textContent = place.name;
  coordinates.textContent = `${place.geometry.location
    .lat()
    .toFixed(6)}, ${place.geometry.location.lng().toFixed(6)}`;

  // Store coordinates for later use
  selectedCoordinates = {
    lat: place.geometry.location.lat(),
    lng: place.geometry.location.lng(),
    name: place.name,
    address: place.formatted_address,
  };

  // Fill form fields
  document.getElementById("placeName").value = place.name;
  document.getElementById("location").value = place.formatted_address;
  document.getElementById("latitude").value = place.geometry.location.lat();
  document.getElementById("longitude").value = place.geometry.location.lng();

  // Show selected location section
  selectedLocation.style.display = "block";

  // Hide search results
  document.getElementById("locationResults").style.display = "none";

  showToast(`Location "${place.name}" selected`, "success");
}

// Confirm location selection
function confirmLocationSelection() {
  if (!selectedCoordinates) {
    showToast("Please select a location first", "error");
    return;
  }

  showToast(`Location "${selectedCoordinates.name}" confirmed!`, "success");

  // Scroll to form
  const formContainer = document.getElementById("addPlaceFormContainer");
  if (formContainer) {
    formContainer.scrollIntoView({ behavior: "smooth" });
  }
}

// Open map for location adjustment
function openMapForLocationAdjustment() {
  if (!selectedCoordinates) {
    showToast("Please search and select a location first", "error");
    return;
  }

  const mapModal = document.getElementById("mapModal");
  if (!mapModal) {
    console.error("Map modal not found");
    return;
  }

  mapModal.style.display = "flex";

  // Initialize adjustment map
  setTimeout(() => {
    if (!window.google || !window.google.maps) {
      showToast("Google Maps not loaded", "error");
      return;
    }

    const adjustmentMapElement = document.getElementById("adjustmentMap");
    if (!adjustmentMapElement) {
      console.error("Adjustment map element not found");
      return;
    }

    adjustmentMap = new google.maps.Map(adjustmentMapElement, {
      center: {
        lat: selectedCoordinates.lat,
        lng: selectedCoordinates.lng,
      },
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: true,
    });

    // Add marker
    adjustmentMarker = new google.maps.Marker({
      position: {
        lat: selectedCoordinates.lat,
        lng: selectedCoordinates.lng,
      },
      map: adjustmentMap,
      draggable: true,
      title: "Drag to adjust location",
    });

    // Update location info when marker is dragged
    adjustmentMarker.addListener("dragend", () => {
      const position = adjustmentMarker.getPosition();
      updateMapLocationInfo(position.lat(), position.lng());
    });

    // Allow clicking on map to set marker
    adjustmentMap.addListener("click", (event) => {
      adjustmentMarker.setPosition(event.latLng);
      updateMapLocationInfo(event.latLng.lat(), event.latLng.lng());
    });

    // Add search box
    const searchBox = new google.maps.places.SearchBox(
      document.getElementById("mapSearchBox")
    );
    adjustmentMap.controls[google.maps.ControlPosition.TOP_LEFT].push(
      document.getElementById("mapSearchBox")
    );

    searchBox.addListener("places_changed", () => {
      const places = searchBox.getPlaces();
      if (places.length === 0) return;

      const place = places[0];
      if (!place.geometry) return;

      adjustmentMarker.setPosition(place.geometry.location);
      adjustmentMap.setCenter(place.geometry.location);
      updateMapLocationInfo(
        place.geometry.location.lat(),
        place.geometry.location.lng(),
        place.name
      );
    });

    // Initialize location info
    updateMapLocationInfo(
      selectedCoordinates.lat,
      selectedCoordinates.lng,
      selectedCoordinates.name
    );
  }, 100);
}

// Update map location info
function updateMapLocationInfo(lat, lng, name = null) {
  const coordinatesElement = document.getElementById("mapCoordinates");
  const locationNameElement = document.getElementById("mapLocationName");

  if (coordinatesElement) {
    coordinatesElement.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  if (name && locationNameElement) {
    locationNameElement.textContent = name;
  }

  // Reverse geocode to get address
  if (geocoder && locationNameElement && !name) {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        locationNameElement.textContent = results[0].formatted_address;
      }
    });
  }
}

// Search on map
function searchOnMap() {
  const query = document.getElementById("mapSearchBox").value;
  if (!query || !query.trim() || !placesService) return;

  const request = {
    query: query,
    fields: ["name", "geometry", "formatted_address"],
  };

  placesService.textSearch(request, (results, status) => {
    const resultsContainer = document.getElementById("mapSearchResults");
    if (!resultsContainer) return;

    resultsContainer.innerHTML = "";

    if (
      status === google.maps.places.PlacesServiceStatus.OK &&
      results.length > 0
    ) {
      results.slice(0, 3).forEach((place) => {
        const item = document.createElement("div");
        item.className = "location-result-item";
        item.innerHTML = `
          <strong>${place.name}</strong><br>
          <small>${place.formatted_address}</small>
        `;
        item.onclick = () => {
          if (adjustmentMarker && adjustmentMap) {
            adjustmentMarker.setPosition(place.geometry.location);
            adjustmentMap.setCenter(place.geometry.location);
            updateMapLocationInfo(
              place.geometry.location.lat(),
              place.geometry.location.lng(),
              place.name
            );
          }
          resultsContainer.innerHTML = "";
        };
        resultsContainer.appendChild(item);
      });
      resultsContainer.style.display = "block";
    }
  });
}

// Confirm map location
function confirmMapLocation() {
  if (!adjustmentMarker) {
    showToast("No location selected on map", "error");
    return;
  }

  const position = adjustmentMarker.getPosition();
  const lat = position.lat();
  const lng = position.lng();

  // Update form fields
  document.getElementById("latitude").value = lat;
  document.getElementById("longitude").value = lng;

  // Update selected location display
  const mapLocationName = document.getElementById("mapLocationName");
  if (mapLocationName && mapLocationName.textContent) {
    document.getElementById("placeName").value =
      mapLocationName.textContent.split(",")[0];
    document.getElementById("location").value = mapLocationName.textContent;

    const selectedLocationName = document.getElementById(
      "selectedLocationName"
    );
    if (selectedLocationName) {
      selectedLocationName.textContent = mapLocationName.textContent;
    }
  }

  const coordinatesElement = document.getElementById("selectedCoordinates");
  if (coordinatesElement) {
    coordinatesElement.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  closeMapModal();
  showToast("Location adjusted and saved!", "success");
}

// Close map modal
function closeMapModal() {
  const mapModal = document.getElementById("mapModal");
  if (mapModal) {
    mapModal.style.display = "none";
  }
  adjustmentMap = null;
  adjustmentMarker = null;
}

// Reset form
function resetForm() {
  const form = document.getElementById("addPlaceForm");
  if (form) {
    form.reset();
  }

  document.getElementById("placeNameSearch").value = "";
  document.getElementById("ratingValue").textContent = "3.0";
  document.getElementById("rating").value = "3.0";
  document.getElementById("latitude").value = "";
  document.getElementById("longitude").value = "";

  const selectedLocation = document.getElementById("selectedLocation");
  if (selectedLocation) {
    selectedLocation.style.display = "none";
  }

  const locationResults = document.getElementById("locationResults");
  if (locationResults) {
    locationResults.style.display = "none";
  }

  selectedCoordinates = null;

  // Reset stars to 3
  document.querySelectorAll(".rating-input .stars").forEach((star, index) => {
    if (index < 3) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
}

// Helper function to show toast notifications
function showToast(message, type = "info") {
  console.log(`Toast (${type}): ${message}`);

  // Create toast element
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${
      type === "success" ? "#4CAF50" : type === "error" ? "#f44336" : "#2196F3"
    };
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;

  // Add to container
  const container = document.getElementById("toastContainer") || document.body;
  container.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Update badges (placeholder)
function updateBadges() {
  console.log("Updating badges...");
  // You can implement badge updates here
}

// Make functions available globally for onclick handlers
window.searchPlaceLocation = searchPlaceLocation;
window.confirmLocationSelection = confirmLocationSelection;
window.openMapForLocationAdjustment = openMapForLocationAdjustment;
window.searchOnMap = searchOnMap;
window.confirmMapLocation = confirmMapLocation;
window.closeMapModal = closeMapModal;
window.resetForm = resetForm;
