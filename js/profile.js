import { auth } from "./firebase/init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

// Check if user is logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is logged in
    displayUserInfo(user);
  } else {
    // No user logged in, redirect to login
    window.location.replace("login.html");
  }
});

function displayUserInfo(user) {
  const name = user.displayName || "User";
  const email = user.email || "No email";
  const createdAt = user.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString() 
    : "Unknown";

  // Update profile header
  document.getElementById("profileName").textContent = name;
  document.getElementById("profileEmail").textContent = email;

  // Update info card
  document.getElementById("infoName").textContent = name;
  document.getElementById("infoEmail").textContent = email;
  document.getElementById("memberSince").textContent = createdAt;

  // Update favorites count
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  document.getElementById("favCount").textContent = favorites.length;

  // Contribution count (placeholder - you can implement this later)
  document.getElementById("contributionCount").textContent = "0";
}

// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.replace("login.html");
  } catch (error) {
    console.error("Error signing out:", error);
    alert("Failed to logout. Please try again.");
  }
});

// Profile icon click handlers
document.getElementById("profile").addEventListener("click", () => {
  window.location.href = "profile.html";
});

const headerProfile = document.getElementById("headerProfile");
if (headerProfile) {
  headerProfile.addEventListener("click", () => {
    window.location.href = "profile.html";
  });
}
