import { db } from './firebase/init.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';

const homeMap = L.map("homeMap", {
  center: [9.03, 38.74],
  zoom: 13,
  zoomControl: false,
  dragging: false,
  scrollWheelZoom: false,
  doubleClickZoom: false,
  boxZoom: false,
  keyboard: false,
  tap: false
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(homeMap);


L.marker([9.0365, 38.7612]).addTo(homeMap);

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
/*
const toggleBtn = document.getElementById("themeToggle");

// Load saved mode
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  toggleBtn.classList.replace("fa-moon", "fa-sun");
}

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");
  toggleBtn.classList.toggle("fa-moon", !isDark);
  toggleBtn.classList.toggle("fa-sun", isDark);

  localStorage.setItem("theme", isDark ? "dark" : "light");
});

*/

async function loadStatistics() {
    try {
        const placesCol = collection(db, 'places');
        const placesSnapshot = await getDocs(placesCol);
        const places = placesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Debug: Log first place to see field names
        if (places.length > 0) {
            console.log('First place data:', places[0]);
        }

        const totalPlaces = places.length;
        document.getElementById('totalPlaces').textContent = totalPlaces.toLocaleString();
        document.getElementById('sidebarTotalPlaces').textContent = totalPlaces;

        const newAdded = places.filter(place => place.tag === 'new').length;
        document.getElementById('newAdded').textContent = newAdded.toLocaleString();

        const uniqueContributors = new Set();
        places.forEach(place => {
            const contributorId = place.added_by || place.addedBy || place.contributor_id || place.contributorId || place.user_id || place.userId;
            if (contributorId) {
                uniqueContributors.add(contributorId);
            }
        });
        
        document.getElementById('totalContributors').textContent = uniqueContributors.size;

        const cafeCount = places.filter(place => place.category && place.category.toLowerCase() === 'cafe').length;
        document.getElementById('cafeCount').textContent = cafeCount;

        const hotelCount = places.filter(place => place.category && place.category.toLowerCase() === 'hotel').length;
        document.getElementById('hotelCount').textContent = hotelCount;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}


document.addEventListener('DOMContentLoaded', loadStatistics);
