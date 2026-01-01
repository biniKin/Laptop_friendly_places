// import { db } from './firebase/init.js';
// import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';

// const homeMap = L.map("homeMap", {
//   center: [9.03, 38.74],
//   zoom: 13,
//   zoomControl: false,
//   dragging: false,
//   scrollWheelZoom: false,
//   doubleClickZoom: false,
//   boxZoom: false,
//   keyboard: false,
//   tap: false
// });
// // 
// L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//   attribution: "&copy; OpenStreetMap contributors"
// }).addTo(homeMap);


// L.marker([9.0365, 38.7612]).addTo(homeMap);

// document.getElementById("profile").addEventListener("click", () => {
//   window.location.href = "profile.html";
// });

// const headerProfile = document.getElementById("headerProfile");
// if (headerProfile) {
//   headerProfile.addEventListener("click", () => {
//     window.location.href = "profile.html";
//   });
// }


// async function loadStatistics() {
//     try {
//         const placesCol = collection(db, 'places');
//         const placesSnapshot = await getDocs(placesCol);
//         const places = placesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

//         if (places.length > 0) {
//             console.log('First place data:', places[0]);
//         }

//         const totalPlaces = places.length;
//         document.getElementById('totalPlaces').textContent = totalPlaces.toLocaleString();
//         document.getElementById('sidebarTotalPlaces').textContent = totalPlaces;

//         const newAdded = places.filter(place => place.tag === 'new').length;
//         document.getElementById('newAdded').textContent = newAdded.toLocaleString();

// try {
//     const contributorsCol = collection(db, 'contributors');
//     const contributorsSnapshot = await getDocs(contributorsCol);
    
//     const uniqueContributorIds = new Set();
//     contributorsSnapshot.forEach(doc => {
//         const contributorId = doc.data().contributor_id;
//         if (contributorId) {
//             uniqueContributorIds.add(contributorId);
//         }
//     });
    
//     document.getElementById('totalContributors').textContent = uniqueContributorIds.size;
//       } catch (error) {
//     console.error('Error fetching contributors:', error);
//     document.getElementById('totalContributors').textContent = '0';
//      }


//         const cafeCount = places.filter(place => place.category && place.category.toLowerCase() === 'cafe').length;
//         document.getElementById('cafeCount').textContent = cafeCount;

//         const hotelCount = places.filter(place => place.category && place.category.toLowerCase() === 'hotel').length;
//         document.getElementById('hotelCount').textContent = hotelCount;
//     } catch (error) {
//         console.error('Error loading statistics:', error);
//     }
// }


// document.addEventListener('DOMContentLoaded', loadStatistics);


import { db } from './firebase/init.js';
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';

// Initialize the home map
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

// Load places and add markers to the map
async function loadPlacesOnMap() {
    try {
        const q = query(
            collection(db, "places"),
            where("status", "==", "approved")
        );

        const snapshot = await getDocs(q);

        snapshot.forEach(docSnap => {
            const place = docSnap.data();

            if (!place.location) return;

            const lat = place.location.latitude;
            const lng = place.location.longitude;

            if (typeof lat !== "number" || typeof lng !== "number") return;

            L.marker([lat, lng])
                .addTo(homeMap);
               
                    
        });
    } catch (err) {
        console.error("Error loading places on map:", err);
    }
}

async function loadStatistics() {
    try {
        const placesCol = collection(db, 'places');
        const placesSnapshot = await getDocs(placesCol);
        const places = placesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (places.length > 0) {
            console.log('First place data:', places[0]);
        }

        const totalPlaces = places.length;
        document.getElementById('totalPlaces').textContent = totalPlaces.toLocaleString();
        document.getElementById('sidebarTotalPlaces').textContent = totalPlaces;

        const newAdded = places.filter(place => place.tag === 'new').length;
        document.getElementById('newAdded').textContent = newAdded.toLocaleString();

       try {
    const contributorsCol = collection(db, 'contributors');
    const contributorsSnapshot = await getDocs(contributorsCol);
    
    const uniqueContributorIds = new Set();
    contributorsSnapshot.forEach(doc => {
        const contributorId = doc.data().contributor_id;
        if (contributorId) {
            uniqueContributorIds.add(contributorId);
        }
    });
    
    document.getElementById('totalContributors').textContent = uniqueContributorIds.size;
      } catch (error) {
    console.error('Error fetching contributors:', error);
    document.getElementById('totalContributors').textContent = '0';
     }


        const cafeCount = places.filter(place => place.category && place.category.toLowerCase() === 'cafe').length;
        document.getElementById('cafeCount').textContent = cafeCount;

        const hotelCount = places.filter(place => place.category && place.category.toLowerCase() === 'hotel').length;
        document.getElementById('hotelCount').textContent = hotelCount;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

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

// Load everything when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadStatistics();
    loadPlacesOnMap();
});
