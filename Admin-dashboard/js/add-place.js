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

  // Add place form
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
      showSection("places");
    });

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

  // Global search
  document
    .getElementById("globalSearch")
    .addEventListener("input", function (e) {
      const query = e.target.value;
      if (
        query &&
        document.getElementById("places").classList.contains("active")
      ) {
        searchPlaces(query);
      }
    });

  // Click outside location results
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".location-search-container")) {
      document.getElementById("locationResults").style.display = "none";
    }
  });
}

async function loadContributorsForSelect() {
  const contributors = await db.get("contributors");
  const select = document.getElementById("contributor");

  contributors.forEach((contributor) => {
    const option = document.createElement("option");
    option.value = contributor.id;
    option.textContent = `${contributor.name} (${contributor.email})`;
    select.appendChild(option);
  });
}

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
