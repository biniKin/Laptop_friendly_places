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
   Check URL parameters for specific place
======================= */
const urlParams = new URLSearchParams(window.location.search);
const targetLat = urlParams.get('lat');
const targetLng = urlParams.get('lng');
const targetPlaceId = urlParams.get('placeId');

let targetMarker = null;

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
      const placeId = docSnap.id;

      // Safety checks
      if (!place.location) return;

      const lat = place.location.latitude;
      const lng = place.location.longitude;

      if (typeof lat !== "number" || typeof lng !== "number") return;

      /* =======================
         Check if this is the target place from URL
      ======================= */
      const isTargetPlace = targetPlaceId && placeId === targetPlaceId;
      
      /* =======================
         Create marker icon (different for target place)
      ======================= */
      let marker;
      if (isTargetPlace) {
        // Create a custom red icon for the target place
        const redIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        
        marker = L.marker([lat, lng], { icon: redIcon }).addTo(map);
        targetMarker = marker;
        
        // Zoom to this place
        map.setView([lat, lng], 16);
      } else {
        marker = L.marker([lat, lng]).addTo(map);
      }

      /* =======================
         Marker + Card Popup
      ======================= */
      marker.bindPopup(`
        <div class="map-card">
          <img
            src="${place.media?.images?.[0] || "https://via.placeholder.com/300x180"}"
            class="map-card-img"
            alt="${place.name}"
          />

          <div class="map-card-body">
            <h3>${place.name}</h3>
            <p class="category">${place.category || "Place"}</p>
            <p class="desc">${place.description || ""}</p>

            <div class="ratings">
              <span>📶 Wi-Fi: ${place.rating?.wifi || "N/A"}</span><br>
              <span>🔌 Power: ${place.rating?.power || "N/A"}</span><br>
              <span>😊 Service: ${place.rating?.customer_service || "N/A"}</span>
            </div>
          </div>
        </div>
      `);
      
      // Auto-open popup for target place
      if (isTargetPlace) {
        marker.openPopup();
      }
    });
  } catch (err) {
    console.error("Error loading places:", err);
  }
}
