// init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import {firebaseConfig} from './firebase/config.js';
/* =======================
   Firebase config
======================= */


/* =======================
   Initialize Firebase
======================= */
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =======================
   Initialize Leaflet Map
======================= */
export const map = L.map("mapViewMap").setView([9.03, 38.74], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

/* =======================
   Load places from Firestore
======================= */
export async function loadPlaces() {
  try {
    // ✅ Only approved places
    const q = query(
      collection(db, "places"),
      where("status", "==", "approved")
    );

    const snapshot = await getDocs(q);

    snapshot.forEach(docSnap => {
      const place = docSnap.data();

      // Safety checks
      if (!place.location) return;

      const lat = place.location.latitude;
      const lng = place.location.longitude;

      if (typeof lat !== "number" || typeof lng !== "number") return;

      /* =======================
         Marker + Card Popup
      ======================= */
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`
          <div class="map-card">
            <img
              src="${place.media?.images?.[0] || "https://via.placeholder.com/300x180"}"
              class="map-card-img"
              alt="${place.name}"
            />

            <div class="map-card-body">
              <h3>${place.name}</h3>
              <p class="category">${place.category}</p>
              <p class="desc">${place.description || ""}</p>

              <div class="ratings">
                <span>📶 Wi-Fi: ${place.rating?.wifi || "N/A"}</span><br>
                <span>🔌 Power: ${place.rating?.power || "N/A"}</span><br>
                <span>😊 Service: ${place.rating?.customer_service || "N/A"}</span>
              </div>
            </div>
          </div>
        `);
    });
  } catch (err) {
    console.error("Error loading places:", err);
  }
}
