import { auth } from "./firebase/init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

// Check authentication
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("login.html");
  }
});

function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites")) || [];
}

function saveFavorites(favorites) {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function removeFavorite(placeId) {
  let favorites = getFavorites();
  favorites = favorites.filter(p => p.id !== placeId);
  saveFavorites(favorites);
  renderFavorites();
}

function createFavoriteCard(place) {
  const card = document.createElement("div");
  card.className = "favorite-card";
  card.dataset.placeId = place.id;

  const imageUrl = place.media?.images?.[0] || "../assets/images/cafe1.jpg";
  
  card.innerHTML = `
    <div class="fav-card-image">
      <img src="${imageUrl}" alt="${place.name}">
      <div class="fav-badge">
        <i class="fa-solid fa-heart"></i> Favorite
      </div>
    </div>
    <div class="fav-card-content">
      <div class="fav-card-header">
        <h3>${place.name}</h3>
        <button class="fav-remove-btn" title="Remove from favorites">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="fav-rating">
        <span class="stars">★★★★★</span>
        <span class="rating-number">${place.rating?.overall || "N/A"}</span>
      </div>
      <div class="fav-features">
        <span class="feature"><i class="fa-solid fa-wifi"></i> WiFi: ${place.rating?.wifi || "N/A"}</span>
        <span class="feature"><i class="fa-solid fa-plug"></i> Power: ${place.rating?.power || "N/A"}</span>
        <span class="feature"><i class="fa-solid fa-face-smile"></i> Service: ${place.rating?.customer_service || "N/A"}</span>
      </div>
      
    </div>
  `;

  // Remove button handler
  const removeBtn = card.querySelector(".fav-remove-btn");
  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    removeFavorite(place.id);
  });

  // Card click handler - open side sheet
  card.addEventListener("click", () => {
    openPlaceSheet(place);
  });

  return card;
}

function renderFavorites() {
  const favorites = getFavorites();
  const grid = document.querySelector(".favorites-grid");
  const emptyState = document.getElementById("emptyState");

  if (favorites.length === 0) {
    grid.style.display = "none";
    emptyState.style.display = "block";
  } else {
    grid.style.display = "grid";
    emptyState.style.display = "none";
    grid.innerHTML = "";
    favorites.forEach(place => {
      grid.appendChild(createFavoriteCard(place));
    });
  }
}

function openPlaceSheet(place) {
  const sheet = document.getElementById("placeSheet");
  const overlay = document.getElementById("sheetOverlay");
  
  // Populate sheet content
  document.getElementById("sheetName").textContent = place.name;
  document.getElementById("sheetDescription").textContent = place.description || "No description available";
  document.getElementById("sheetRating").textContent = place.rating?.overall || "N/A";
  document.getElementById("sheetWifi").textContent = place.rating?.wifi || "N/A";
  document.getElementById("sheetPower").textContent = place.rating?.power || "N/A";
  document.getElementById("sheetService").textContent = place.rating?.customer_service || "N/A";
  
  // Handle media carousel (images and videos)
  const carousel = document.getElementById("mediaCarousel");
  carousel.innerHTML = "";
  
  let hasMedia = false;
  
  // Add images
  if (place.media?.images && place.media.images.length > 0) {
    place.media.images.forEach((img, index) => {
      const imgElement = document.createElement("img");
      imgElement.src = img;
      imgElement.alt = place.name;
      imgElement.className = index === 0 && !hasMedia ? "active" : "";
      carousel.appendChild(imgElement);
      hasMedia = true;
    });
  }
  
  // Add videos (only if not null and array has items)
  if (place.media?.videos && Array.isArray(place.media.videos) && place.media.videos.length > 0) {
    place.media.videos.forEach((videoUrl) => {
      // Skip if video URL is null, undefined, or empty
      if (videoUrl && videoUrl.trim() !== "") {
        const videoElement = document.createElement("video");
        videoElement.src = videoUrl;
        videoElement.controls = true;
        videoElement.className = !hasMedia ? "active" : "";
        videoElement.setAttribute("playsinline", "");
        carousel.appendChild(videoElement);
        hasMedia = true;
      }
    });
  }
  
  // If no media, show placeholder
  if (!hasMedia) {
    const imgElement = document.createElement("img");
    imgElement.src = "../assets/images/cafe1.jpg";
    imgElement.alt = place.name;
    imgElement.className = "active";
    carousel.appendChild(imgElement);
  }
  
  // Reset carousel to first slide
  currentSlide = 0;
  
  // Store place data for buttons
  sheet.dataset.placeId = place.id;
  sheet.dataset.placeName = place.name;
  sheet.dataset.lat = place.location?.latitude || "";
  sheet.dataset.lng = place.location?.longitude || "";
  
  // Show sheet
  sheet.classList.add("active");
  overlay.classList.add("active");
}

function closePlaceSheet() {
  const sheet = document.getElementById("placeSheet");
  const overlay = document.getElementById("sheetOverlay");
  sheet.classList.remove("active");
  overlay.classList.remove("active");
}

// Initialize
renderFavorites();

// Close sheet handlers
document.getElementById("closeSheet").addEventListener("click", closePlaceSheet);
document.getElementById("sheetOverlay").addEventListener("click", closePlaceSheet);

// View map button
document.getElementById("viewMapBtn").addEventListener("click", () => {
  const sheet = document.getElementById("placeSheet");
  const lat = sheet.dataset.lat;
  const lng = sheet.dataset.lng;
  const placeId = sheet.dataset.placeId;
  
  if (lat && lng) {
    window.location.href = `map-view.html?lat=${lat}&lng=${lng}&placeId=${placeId}`;
  } else {
    alert("Location data not available");
  }
});

// Report button
document.getElementById("reportBtn").addEventListener("click", () => {
  const sheet = document.getElementById("placeSheet");
  const modal = document.getElementById("reportModal");
  
  modal.dataset.placeId = sheet.dataset.placeId;
  modal.dataset.placeName = sheet.dataset.placeName;
  
  // Close the side sheet first
  closePlaceSheet();
  
  // Then open the modal
  modal.classList.remove("hidden");
});

// Profile icon handler
document.getElementById("profile").addEventListener("click", () => {
  window.location.href = "profile.html";
});

const headerProfile = document.getElementById("headerProfile");
if (headerProfile) {
  headerProfile.addEventListener("click", () => {
    window.location.href = "profile.html";
  });
}


// Report form submission
document.getElementById("reportForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const modal = document.getElementById("reportModal");
  const placeId = modal.dataset.placeId;
  const placeName = modal.dataset.placeName;

  const issueType = document.getElementById("issueType").value;
  const description = document.getElementById("desc").value;

  console.log("Reporting place:");
  console.log("ID:", placeId);
  console.log("Name:", placeName);
  console.log("Issue type:", issueType);
  console.log("Description:", description);

  try {
    const { db } = await import("./firebase/init.js");
    const { collection, addDoc, Timestamp } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
    
    const reportsCol = collection(db, "reports");
    
    // Add report to Firestore with proper structure
    await addDoc(reportsCol, {
      place_id: placeId,
      reported_by: auth.currentUser?.uid || "anonymous",
      status: "pending",
      reason: issueType,
      message: description,
      created_at: Timestamp.now()
    });

    alert("Report submitted successfully! Our team will review it.");
    document.getElementById("reportForm").reset();
  } catch (error) {
    console.error("Error submitting report:", error);
    alert("Failed to submit report. Please try again.");
  }

  modal.classList.add("hidden");
});

// Close modal
document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("reportModal").classList.add("hidden");
});

// Carousel navigation
let currentSlide = 0;

function showSlide(index) {
  const carousel = document.getElementById("mediaCarousel");
  const mediaItems = carousel.querySelectorAll("img, video");
  
  if (mediaItems.length === 0) return;
  
  // Pause all videos before switching
  mediaItems.forEach((item) => {
    if (item.tagName === "VIDEO") {
      item.pause();
      item.currentTime = 0;
    }
  });
  
  currentSlide = (index + mediaItems.length) % mediaItems.length;
  
  mediaItems.forEach((item, i) => {
    item.classList.toggle("active", i === currentSlide);
  });
}

document.getElementById("prevBtn").addEventListener("click", () => {
  showSlide(currentSlide - 1);
});

document.getElementById("nextBtn").addEventListener("click", () => {
  showSlide(currentSlide + 1);
});
