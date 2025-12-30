import { auth, db } from "./firebase/init.js";
import { supabase } from "./supabase/client.js";


import { collection, addDoc, GeoPoint } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

  const photoBox = document.getElementById("photoBox");
  const videoBox = document.getElementById("videoBox");
  const photoInput = document.getElementById("photoInput");
  const videoInput = document.getElementById("videoInput");
  const imagePreview = document.getElementById("imagePreview");
  const videoPreview = document.getElementById("videoPreview");
  const ratingInput = document.getElementById("overallRating");

  let selectedImages = [];
  let selectedVideo = null;

  /* -------------------- MEDIA PICKERS -------------------- */

  photoBox.onclick = () => photoInput.click();
  videoBox.onclick = () => videoInput.click();

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
      wrapper.className = "preview-item";

      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);

      const removeBtn = document.createElement("span");
      removeBtn.className = "remove-btn";
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
    wrapper.className = "preview-item";

    const video = document.createElement("video");
    video.src = URL.createObjectURL(selectedVideo);
    video.controls = true;

    const removeBtn = document.createElement("span");
    removeBtn.className = "remove-btn";
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
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
  setTimeout(() => map.invalidateSize(), 300);

  let marker;
  map.on("click", e => {
    document.getElementById("lat").value = e.latlng.lat;
    document.getElementById("lng").value = e.latlng.lng;
    if (marker) map.removeLayer(marker);
    marker = L.marker(e.latlng).addTo(map);
  });

  /* -------------------- STAR RATING -------------------- */

  document.querySelectorAll(".stars span").forEach(star => {
    star.onclick = () => {
      const val = Number(star.dataset.value);
      ratingInput.value = val;
      document.querySelectorAll(".stars span").forEach(s =>
        s.classList.toggle("active", Number(s.dataset.value) <= val)
      );
    };
  });

  /* -------------------- UPLOAD (SUPABASE) -------------------- */

  async function upload(file, folder) {
    const path = `${folder}/${Date.now()}-${file.name}`;
    await supabase.storage.from("places-media").upload(path, file);
    return supabase.storage.from("places-media").getPublicUrl(path).data.publicUrl;
  }

  /* -------------------- FORM SUBMIT -------------------- */

  document.getElementById("contribute-form").onsubmit = async e => {
    e.preventDefault();

    const images = [];
    for (const img of selectedImages) {
      images.push(await upload(img, "images"));
    }

    let videoUrl = null;
    if (selectedVideo) {
      videoUrl = await upload(selectedVideo, "videos");
    }

    await addDoc(collection(db, "places"), {
      name: placeName.value,
      category: category.value,
      description: description.value,
      location: new GeoPoint(+lat.value, +lng.value),
      rating: { overall: +ratingInput.value },
      media: {
        images,
        video: videoUrl
      },
      status: "pending",
      createdAt: new Date()
    });

    alert("✅ Submitted for approval");

    e.target.reset();
    selectedImages = [];
    selectedVideo = null;
    imagePreview.innerHTML = "";
    videoPreview.innerHTML = "";
  };

});
