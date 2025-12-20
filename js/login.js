// Get forms
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
function setError(id, message) {
    document.getElementById(id).innerText = message;
}
function showError(id, message) {
    const box = document.getElementById(id);
    box.innerText = message;
    box.style.display = "block";
}

function hideError(id) {
    document.getElementById(id).style.display = "none";
}


function clearErrors() {
    document.querySelectorAll(".error").forEach(e => e.innerText = "");
}

// Switch buttons
document.getElementById("showSignup").onclick = () => {
    loginForm.classList.remove("active");
    signupForm.classList.add("active");
};

document.getElementById("showLogin").onclick = () => {
    signupForm.classList.remove("active");
    loginForm.classList.add("active");
};

// Get users from localStorage (JSON)
function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

// Save users to localStorage (JSON)
function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

/* ================= SIGN UP ================= */
signupForm.addEventListener("submit", function (e) {
    e.preventDefault();
    hideError("signupError");

    const name = signupName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value;
    const confirm = signupConfirm.value;

    if (!name || !email || !password || !confirm) {
        showError("signupError", "Please fill out all required fields.");
        return;
    }

    if (password.length < 6) {
        showError("signupError", "Password does not meet requirements.");
        return;
    }

    if (password !== confirm) {
        showError("signupError", "Passwords do not match.");
        return;
    }

    const users = getUsers();
    if (users.some(u => u.email === email)) {
        showError("signupError", "Email is already registered.");
        return;
    }

    users.push({ name, email, password });
    saveUsers(users);

    signupForm.reset();
    hideError("signupError");
    signupForm.classList.remove("active");
    loginForm.classList.add("active");
});


/* ================= LOGIN ================= */
loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    hideError("loginError");

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
        showError("loginError", "Please fill out all required fields.");
        return;
    }

    const users = getUsers();
    const user = users.find(
        u => u.email === email && u.password === password
    );

    if (!user) {
        showError("loginError", "Incorrect email or password.");
        return;
    }

    loginForm.reset();
    hideError("loginError");
    alert(`Welcome ${user.name}`);
});

// Password Eye Toggle
document.querySelectorAll(".toggle").forEach(icon => {
    icon.addEventListener("click", () => {
        const input = document.getElementById(icon.dataset.target);

        if (input.type === "password") {
            input.type = "text";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        } else {
            input.type = "password";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    });
});
document.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
        hideError("loginError");
        hideError("signupError");
    });
});


