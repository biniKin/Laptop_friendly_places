document.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("adminLoggedIn") === "true") {
    window.location.href = "index.html";
  }

  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username === "admin" && password === "admin123") {
      localStorage.setItem("adminLoggedIn", "true");
      localStorage.setItem("adminUsername", username);

      errorMessage.textContent = "";

      setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    } else {
      errorMessage.textContent = "Invalid credentials. Use: admin / admin123";
      loginForm.classList.add("shake");
      setTimeout(() => loginForm.classList.remove("shake"), 500);
    }
  });

  const inputs = document.querySelectorAll("input");
  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      this.parentElement.style.transform = "translateY(-2px)";
    });

    input.addEventListener("blur", function () {
      this.parentElement.style.transform = "translateY(0)";
    });
  });
});
