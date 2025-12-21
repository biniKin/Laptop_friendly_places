// ===============================
// DARK MODE TOGGLE
// ===============================

// Select theme icon
const themeToggle = document.querySelector(".sidebar-bottom i");

// Load saved theme
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.classList.replace("fa-sun", "fa-moon");
}

// Toggle theme on click
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
        themeToggle.classList.replace("fa-sun", "fa-moon");
    } else {
        localStorage.setItem("theme", "light");
        themeToggle.classList.replace("fa-moon", "fa-sun");
    }
});


// ===============================
// REMOVE FAVORITE CARD
// ===============================

const removeButtons = document.querySelectorAll(".fav-remove-btn");
const favoritesGrid = document.querySelector(".favorites-grid");
const emptyState = document.getElementById("emptyState");

removeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        const card = btn.closest(".favorite-card");
        card.remove();

        // Show empty state if no favorites left
        if (favoritesGrid.children.length === 0) {
            favoritesGrid.style.display = "none";
            emptyState.style.display = "flex";
        }
    });
});
