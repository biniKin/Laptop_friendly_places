

import { auth, db } from "./firebase/init.js";
import { getDocs, collection } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const container = document.querySelector(".places-container");

function createCard(place) {
  const card = document.createElement("div");

  card.className = "place-card";

  card.innerHTML = `
    <div class="place-image">
      <img src="${place.media.images[0]}" alt="${place.name}">
      <button class="favorite-btn">
        <i class="fa-regular fa-heart"></i>
      </button>
    </div>

    <div class="place-info">
      <h3>${place.name}</h3>

      <div class="place-rating">
        <i class="fa-solid fa-star"></i> ${place.rating.overall}
      </div>

      <div class="place-features">
        <span class="feature" id="wifi-feature" title="Wifi rating">
          <i class="fa-solid fa-wifi"></i> ${place.rating.wifi}
        </span>
        <span class="feature" id="power-feature" title="Power rating">
          <i class="fa-solid fa-plug"></i> ${place.rating.power}
        </span>
        <span class="feature" id="customer-feature" title="Customer service rating">
          <i class="fa-solid fa-face-smile"></i> ${place.rating.customer_service}
        </span>
      </div>

      <p class="place-address">${place.description}</p>
    </div>
  `;

  return card;
}

async function fetchPlaces() {
  try {
    const placesCol = collection(db, "places");
    const snapshot = await getDocs(placesCol);

    const places = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    places.forEach(place => {
      const card = createCard(place);
      container.appendChild(card); 
    });

  } catch (error) {
    console.error("Error fetching places:", error);
  }
}

fetchPlaces();
