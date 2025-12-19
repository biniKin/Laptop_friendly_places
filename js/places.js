import {auth, db} from "./firebase/init.js";
import {getDocs, collection} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

async function fetchPlaces() {
  try {
    const placesCol = collection(db, "places"); // reference to collection
    const snapshot = await getDocs(placesCol);  // fetch all documents
    const places = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log("Places:", places[0]);

    // Now you can display them
    // displayPlaces(places);
  } catch (error) {
    console.error("Error fetching places:", error);
  }
}


fetchPlaces();

