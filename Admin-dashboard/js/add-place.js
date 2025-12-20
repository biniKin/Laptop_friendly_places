// js/add-place.js
document.addEventListener("DOMContentLoaded", function () {
  // Initialize page
  if (!initPage()) return;

  // Load contributors for dropdown
  loadContributorsForSelect();
  updateBadges();

  // Setup event listeners
  setupEventListeners();
});

// Load contributors for select dropdown
async function loadContributorsForSelect() {
  const contributors = await db.get("contributors");
  const select = document.getElementById("contributor");

  // Clear existing options
  select.innerHTML = '<option value="">Select contributor (optional)</option>';

  contributors.forEach((contributor) => {
    const option = document.createElement("option");
    option.value = contributor.id;
    option.textContent = `${contributor.name} (${contributor.email})`;
    select.appendChild(option);
  });
}

// Setup event listeners
function setupEventListeners() {
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
  document
    .getElementById("addPlaceForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const lat = parseFloat(document.getElementById("latitude").value);
      const lng = parseFloat(document.getElementById("longitude").value);

      if (!lat || !lng) {
        showToast("Please select a location on the map first", "error");
        return;
      }

      const ratingValue = parseFloat(document.getElementById("rating").value);
      const contributorId = document.getElementById("contributor").value;
      let addedBy = "admin";
      let status = "verified"; // Admin added places are automatically verified

      if (contributorId) {
        const contributors = await db.get("contributors");
        const contributor = contributors.find((c) => c.id === contributorId);
        if (contributor) {
          addedBy = contributor.name;
          status = "pending"; // Contributor added places need approval

          // Update contributor's places count
          await db.update("contributors", contributorId, {
            placesAdded: contributor.placesAdded + 1,
          });
        }
      }

      const placeData = {
        id: Date.now(),
        name: document.getElementById("placeName").value,
        type: document.getElementById("placeType").value,
        location: document.getElementById("location").value,
        wifiSpeed: document.getElementById("wifiSpeed").value,
        powerOutlets: document.getElementById("powerOutlets").value,
        noiseLevel: document.getElementById("noiseLevel").value,
        description: document.getElementById("description").value,
        rating: ratingValue,
        image: document.getElementById("imageUrl").value,
        status: status,
        addedBy: addedBy,
        contributorId: contributorId || null,
        addedDate: new Date().toISOString().split("T")[0],
        reports: 0,
        latitude: lat,
        longitude: lng,
      };

      await db.add("places", placeData);

      // Add activity
      const newActivity = {
        id: database.activities.length + 1,
        type: "place_added",
        message: `Added new place '${placeData.name}'`,
        timestamp:
          new Date().toLocaleDateString() +
          " " +
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
      };
      database.activities.unshift(newActivity);

      showToast(
        `Place "${placeData.name}" added successfully! ${
          status === "verified"
            ? "It is automatically verified."
            : "It needs admin approval."
        }`,
        "success"
      );

      resetForm();
      updateBadges();

      // Redirect to places page after 2 seconds
      setTimeout(() => {
        window.location.href = "places.html";
      }, 2000);
    });

  // Click outside location results
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".location-search-container")) {
      document.getElementById("locationResults").style.display = "none";
    }
  });

  // Global search
  const globalSearch = document.getElementById("globalSearch");
  if (globalSearch) {
    globalSearch.addEventListener("input", function (e) {
      const query = e.target.value;
      // Search functionality can be implemented here
    });
  }
}

// Search place location using Google Places API
function searchPlaceLocation() {
  const query = document.getElementById("placeNameSearch").value;
  if (!query.trim()) {
    showToast("Please enter a place name to search", "error");
    return;
  }

  const resultsContainer = document.getElementById("locationResults");
  resultsContainer.innerHTML =
    '<div style="padding: 20px; text-align: center;">Searching...</div>';
  resultsContainer.style.display = "block";

  // Use Google Places API to search for the place
  const request = {
    query: query,
    fields: ["name", "geometry", "formatted_address"],
  };

  if (!placesService) {
    showToast("Maps service not initialized", "error");
    return;
  }

  placesService.textSearch(request, (results, status) => {
    resultsContainer.innerHTML = "";

    if (
      status === google.maps.places.PlacesServiceStatus.OK &&
      results.length > 0
    ) {
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
      resultsContainer.innerHTML =
        '<div style="padding: 20px; text-align: center; color: var(--danger);">No locations found. Try a different search term.</div>';
    }
  });
}

// Select location from search results
function selectLocation(place) {
  const selectedLocation = document.getElementById("selectedLocation");
  const locationName = document.getElementById("selectedLocationName");
  const coordinates = document.getElementById("selectedCoordinates");

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
}

// Confirm location selection
function confirmLocationSelection() {
  if (!selectedCoordinates) {
    showToast("Please select a location first", "error");
    return;
  }

  showToast(`Location "${selectedCoordinates.name}" confirmed!`, "success");

  // Scroll to form
  document
    .getElementById("addPlaceFormContainer")
    .scrollIntoView({ behavior: "smooth" });
}

// Open map for location adjustment
function openMapForLocationAdjustment() {
  if (!selectedCoordinates) {
    showToast("Please search and select a location first", "error");
    return;
  }

  document.getElementById("mapModal").style.display = "flex";

  // Initialize adjustment map
  setTimeout(() => {
    adjustmentMap = new google.maps.Map(
      document.getElementById("adjustmentMap"),
      {
        center: {
          lat: selectedCoordinates.lat,
          lng: selectedCoordinates.lng,
        },
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
      }
    );

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
  document.getElementById("mapCoordinates").textContent = `${lat.toFixed(
    6
  )}, ${lng.toFixed(6)}`;

  // Reverse geocode to get address
  if (geocoder) {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        const address = name || results[0].formatted_address;
        document.getElementById("mapLocationName").textContent = address;
      }
    });
  }
}

// Search on map
function searchOnMap() {
  const query = document.getElementById("mapSearchBox").value;
  if (!query.trim()) return;

  const request = {
    query: query,
    fields: ["name", "geometry", "formatted_address"],
  };

  placesService.textSearch(request, (results, status) => {
    const resultsContainer = document.getElementById("mapSearchResults");
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
          adjustmentMarker.setPosition(place.geometry.location);
          adjustmentMap.setCenter(place.geometry.location);
          updateMapLocationInfo(
            place.geometry.location.lat(),
            place.geometry.location.lng(),
            place.name
          );
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
  const position = adjustmentMarker.getPosition();
  const lat = position.lat();
  const lng = position.lng();

  // Update form fields
  document.getElementById("latitude").value = lat;
  document.getElementById("longitude").value = lng;

  // Update selected location display
  const mapLocationName =
    document.getElementById("mapLocationName").textContent;
  if (mapLocationName) {
    document.getElementById("placeName").value = mapLocationName.split(",")[0];
    document.getElementById("location").value = mapLocationName;
    document.getElementById("selectedLocationName").textContent =
      mapLocationName;
  }

  document.getElementById("selectedCoordinates").textContent = `${lat.toFixed(
    6
  )}, ${lng.toFixed(6)}`;

  closeMapModal();
  showToast("Location adjusted and saved!", "success");
}

// Close map modal
function closeMapModal() {
  document.getElementById("mapModal").style.display = "none";
  adjustmentMap = null;
  adjustmentMarker = null;
}

// Reset form
function resetForm() {
  document.getElementById("addPlaceForm").reset();
  document.getElementById("placeNameSearch").value = "";
  document.getElementById("ratingValue").textContent = "3.0";
  document.getElementById("rating").value = "3.0";
  document.getElementById("latitude").value = "";
  document.getElementById("longitude").value = "";
  document.getElementById("selectedLocation").style.display = "none";
  document.getElementById("locationResults").style.display = "none";
  selectedCoordinates = null;

  document.querySelectorAll(".rating-input .stars").forEach((star, index) => {
    if (index < 3) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
}
