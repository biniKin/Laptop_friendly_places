import { auth, db } from "./firebase/init.js";
import { supabase } from "./supabase/client.js";
import { collection, addDoc, GeoPoint, getDocs, getDoc, doc, orderBy, query, limit } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

// Check authentication
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("login.html");
  }
});

document.addEventListener("DOMContentLoaded", () => {

  const photoUploadArea = document.getElementById("photoUploadArea");
  const videoUploadArea = document.getElementById("videoUploadArea");
  const photoInput = document.getElementById("photoInput");
  const videoInput = document.getElementById("videoInput");
  const imagePreview = document.getElementById("imagePreview");
  const videoPreview = document.getElementById("videoPreview");
  const ratingInput = document.getElementById("overallRating");

  let selectedImages = [];
  let selectedVideo = null;

  /* -------------------- MEDIA PICKERS -------------------- */

  photoUploadArea.onclick = () => photoInput.click();
  videoUploadArea.onclick = () => videoInput.click();

  photoInput.onchange = () => {
    selectedImages = [...photoInput.files].slice(0, 3);
    renderImagePreviews();
  };

  videoInput.onchange = () => {
    selectedVideo = videoInput.files[0] || null;
    renderVideoPreview();
  };

  /* -------------------- IMAGE PREVIEW -------------------- */

  function renderImagePreviews() {
    imagePreview.innerHTML = "";

    selectedImages.forEach((file, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "uploaded-image";

      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-image";
      removeBtn.innerHTML = "&times;";

      removeBtn.onclick = () => {
        selectedImages.splice(index, 1);
        updateImageInput();
        renderImagePreviews();
      };

      wrapper.appendChild(img);
      wrapper.appendChild(removeBtn);
      imagePreview.appendChild(wrapper);
    });
  }

  function updateImageInput() {
    const dt = new DataTransfer();
    selectedImages.forEach(file => dt.items.add(file));
    photoInput.files = dt.files;
  }

  /* -------------------- VIDEO PREVIEW -------------------- */

  function renderVideoPreview() {
    videoPreview.innerHTML = "";

    if (!selectedVideo) return;

    const wrapper = document.createElement("div");
    wrapper.className = "uploaded-image";

    const video = document.createElement("video");
    video.src = URL.createObjectURL(selectedVideo);
    video.controls = true;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-image";
    removeBtn.innerHTML = "&times;";

    removeBtn.onclick = () => {
      selectedVideo = null;
      videoInput.value = "";
      videoPreview.innerHTML = "";
    };

    wrapper.appendChild(video);
    wrapper.appendChild(removeBtn);
    videoPreview.appendChild(wrapper);
  }

  /* -------------------- MAP -------------------- */

  const map = L.map("map").setView([9.03, 38.74], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
  
  setTimeout(() => map.invalidateSize(), 300);

  let marker;
  map.on("click", e => {
    document.getElementById("lat").value = e.latlng.lat;
    document.getElementById("lng").value = e.latlng.lng;
    if (marker) map.removeLayer(marker);
    marker = L.marker(e.latlng).addTo(map);
  });

  /* -------------------- STAR RATING -------------------- */

  document.querySelectorAll(".rating-stars .star").forEach(star => {
    star.onclick = () => {
      const val = Number(star.dataset.value);
      ratingInput.value = val;
      document.querySelectorAll(".rating-stars .star").forEach(s =>
        s.classList.toggle("active", Number(s.dataset.value) <= val)
      );
    };
  });

  /* -------------------- UPLOAD (SUPABASE) -------------------- */

  async function upload(file, folder) {
    try {
      // Check if user is authenticated
      // const { data: { session } } = await supabase.auth.getSession();
      
      // if (!session) {
      //   throw new Error("You must be logged in to upload files");
      // }

      // folder will be either "images" or "videos"
      const path = `${folder}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("placeImages")
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error("Upload error:", error);
        throw error;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from("placeImages")
        .getPublicUrl(path);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  }

  /* -------------------- FORM SUBMIT -------------------- */

  document.getElementById("contributeForm").onsubmit = async e => {
    e.preventDefault();

    // Validation
    if (selectedImages.length === 0) {
      alert("Please upload at least one image");
      return;
    }

    if (!document.getElementById("lat").value || !document.getElementById("lng").value) {
      alert("Please select a location on the map");
      return;
    }

    if (!ratingInput.value) {
      alert("Please select an overall rating");
      return;
    }

    try {
      // Show loading state
      const submitBtn = e.target.querySelector('.submit-btn');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
      submitBtn.disabled = true;

      // Upload images
      const images = [];
      for (const img of selectedImages) {
        images.push(await upload(img, "images"));
      }

      // Upload video if exists
      let videoUrl = null;
      if (selectedVideo) {
        videoUrl = await upload(selectedVideo, "videos");
      }

      // Get form values
      const placeName = document.getElementById("placeName").value;
      const category = document.getElementById("category").value;
      const description = document.getElementById("description").value;
      const lat = document.getElementById("lat").value;
      const lng = document.getElementById("lng").value;
      const wifi = document.getElementById("wifi").value || "3";
      const power = document.getElementById("power").value || "3";
      const service = document.getElementById("service").value || "3";

      // Submit to Firestore
      await addDoc(collection(db, "places"), {
        name: placeName,
        category: category,
        description: description,
        location: new GeoPoint(parseFloat(lat), parseFloat(lng)),
        rating: {
          overall: parseFloat(ratingInput.value),
          wifi: parseFloat(wifi),
          power: parseFloat(power),
          customer_service: parseFloat(service)
        },
        media: {
          images: images,
          videos: videoUrl ? [videoUrl] : null
        },
        status: "pending",
        tag: "new",
        created_at: new Date(),
        contributed_by: auth.currentUser?.uid || "anonymous"
      });

      alert("✅ Place submitted successfully! It will be reviewed by our team.");

      // Reset form
      e.target.reset();
      selectedImages = [];
      selectedVideo = null;
      imagePreview.innerHTML = "";
      videoPreview.innerHTML = "";
      if (marker) map.removeLayer(marker);
      document.querySelectorAll(".rating-stars .star").forEach(s => s.classList.remove("active"));

      // Restore button
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;

      // Redirect to places page
      setTimeout(() => {
        // window.location.href = "places.html";
      }, 2000);

    } catch (error) {
      console.error("Error submitting place:", error);
      alert("Failed to submit place. Please try again.");
      
      // Restore button
      const submitBtn = e.target.querySelector('.submit-btn');
      submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Place';
      submitBtn.disabled = false;
    }
  };

  // Profile icon handlers
  document.getElementById("profile").addEventListener("click", () => {
    window.location.href = "profile.html";
  });

  const headerProfile = document.getElementById("headerProfile");
  if (headerProfile) {
    headerProfile.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
  }

  /* -------------------- FETCH AND DISPLAY CONTRIBUTORS -------------------- */
  
  async function fetchContributors() {
    const loadingEl = document.getElementById("contributorsLoading");
    const listEl = document.getElementById("contributorsList");
    const emptyEl = document.getElementById("contributorsEmpty");

    try {
      loadingEl.style.display = "flex";
      listEl.innerHTML = "";
      emptyEl.style.display = "none";

      // Fetch contributors ordered by total_contributions
      const contributorsCol = collection(db, "contributors");
      const q = query(contributorsCol, orderBy("total_contributions", "desc"), limit(10));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        loadingEl.style.display = "none";
        emptyEl.style.display = "block";
        return;
      }

      // Fetch user details for each contributor
      const contributors = [];
      for (const contributorDoc of snapshot.docs) {
        const contributorData = contributorDoc.data();
        
        // Fetch user details
        try {
          const userDoc = await getDoc(doc(db, "users", contributorData.contributor_id));
          if (userDoc.exists()) {
            contributors.push({
              id: contributorData.contributors_id,
              name: userDoc.data().name || "Anonymous",
              email: userDoc.data().email || "",
              totalContributions: contributorData.total_contributions || 0,
              placesIds: contributorData.places_ids || []
            });
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      }

      // Display contributors
      loadingEl.style.display = "none";
      
      if (contributors.length === 0) {
        emptyEl.style.display = "block";
        return;
      }

      contributors.forEach((contributor, index) => {
        const item = createContributorItem(contributor, index + 1);
        listEl.appendChild(item);
      });

    } catch (error) {
      console.error("Error fetching contributors:", error);
      loadingEl.style.display = "none";
      emptyEl.style.display = "block";
    }
  }

  function createContributorItem(contributor, rank) {
    const item = document.createElement("div");
    item.className = "contributor-item";

    const rankClass = rank === 1 ? "top-1" : rank === 2 ? "top-2" : rank === 3 ? "top-3" : "";
    const initial = contributor.name.charAt(0).toUpperCase();

    item.innerHTML = `
      <div class="contributor-rank ${rankClass}">${rank}</div>
      <div class="contributor-avatar">${initial}</div>
      <div class="contributor-info">
        <div class="contributor-name">${contributor.name}</div>
        <div class="contributor-stats">
          <i class="fa-solid fa-map-location-dot"></i>
          <span class="contributor-count">${contributor.totalContributions}</span>
          <span>${contributor.totalContributions === 1 ? 'place' : 'places'}</span>
        </div>
      </div>
    `;

    return item;
  }

  // Fetch contributors on page load
  fetchContributors();

});