import { auth, db } from "./firebase/init.js";
import {
  getDocs,
  collection
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* -------------------- DOM -------------------- */

const tabs = document.querySelectorAll(".tab");
const loader = document.getElementById("loading");


const containers = {
  all: document.getElementById("all"),
  new: document.getElementById("new"),
  popular: document.getElementById("popular")
};



/* -------------------- STATE -------------------- */

let allPlaces = [];


function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites")) || [];
}

function saveFavorites(favorites) {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function isFav(id) {
  return getFavorites().some(p => p.id === id);
}

function toggleFavorite(place) {
  let favorites = getFavorites();

  const index = favorites.findIndex(p => p.id === place.id);

  if (index === -1) {
    favorites.push(place); // add
  } else {
    favorites.splice(index, 1); // remove
  }

  saveFavorites(favorites);
}


/* -------------------- UI -------------------- */

function createCard(place) {
  const card = document.createElement("div");
  card.className = "place-card";

  card.innerHTML = `
    <div class="place-image">
      <img src="${place.media.images[0]}" alt="${place.name}">
      <button class="favorite-btn" id="fav-btn">
        <i class="${isFav(place.id) ?"fa-solid" : "fa-regular" } fa-heart"></i>
      </button>
    </div>

    <div class="place-info">
      <h3>${place.name}</h3>

      <div class="place-rating">
        <i class="fa-solid fa-star"></i> ${place.rating.overall}
      </div>

      <div class="place-features">
        <span class="feature wifi-feature" title="Wifi rating">
          <i class="fa-solid fa-wifi"></i> ${place.rating.wifi}
        </span>
        <span class="feature power-feature" title="Power rating">
          <i class="fa-solid fa-plug"></i> ${place.rating.power}
        </span>
        <span class="feature customer-feature" title="Customer service rating">
          <i class="fa-solid fa-face-smile"></i> ${place.rating.customer_service}
        </span>
      </div>

      <p class="place-address">${place.description}</p>
    </div>
  `;
  const favBtn = card.querySelector(".favorite-btn");
  const icon = favBtn.querySelector("i");

  
favBtn.addEventListener("click", () => {
  toggleFavorite(place);

  icon.classList.toggle("fa-solid");
  icon.classList.toggle("fa-regular");
});

  return card;
}

/* -------------------- RENDER -------------------- */

function renderPlaces(type) {
  // clear all containers
  Object.values(containers).forEach(c => (c.innerHTML = ""));

  allPlaces.forEach(place => {
    if (type === "all" || place.tag === type) {
      containers[type].appendChild(createCard(place));
    }
  });
}

/* -------------------- TABS -------------------- */

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const type = tab.dataset.target;
    renderPlaces(type);
  });
});


/* -------------------- FIREBASE -------------------- */

async function fetchPlaces() {
  try {
    loader.style.display = "flex";
    const placesCol = collection(db, "places");
    const snapshot = await getDocs(placesCol);

    allPlaces = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // initial render
    loader.style.display = "none";
    renderPlaces("all");

    console.log(getFavorites());

  } catch (error) {
    console.error("Error fetching places:", error);
  }
}




fetchPlaces();
