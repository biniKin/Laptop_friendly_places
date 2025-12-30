document.addEventListener("DOMContentLoaded", () => {
    const darkModeToggle = document.getElementById("darkModeToggle");
    const body = document.body;

    // Load saved theme
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        body.classList.add("dark-mode");
        darkModeToggle.classList.replace("fa-moon", "fa-sun");
    }

    // Toggle dark mode
    darkModeToggle.addEventListener("click", () => {
        body.classList.toggle("dark-mode");

        if (body.classList.contains("dark-mode")) {
            localStorage.setItem("theme", "dark");
            darkModeToggle.classList.replace("fa-moon", "fa-sun");
        } else {
            localStorage.setItem("theme", "light");
            darkModeToggle.classList.replace("fa-sun", "fa-moon");
        }
    });
});
