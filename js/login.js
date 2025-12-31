import {auth, db} from "./firebase/init.js";
import { createUserWithEmailAndPassword, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {getDocs,collection,addDoc} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User already logged in → redirect
        window.location.replace("home.html");
    }
});

// Get forms
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

function setError(id, message) {
    const errorElement = document.getElementById(id);
    if (errorElement) {
        errorElement.innerText = message;
        errorElement.style.display = "block";
    }
}

function clearError(id) {
    const errorElement = document.getElementById(id);
    if (errorElement) {
        errorElement.innerText = "";
        errorElement.style.display = "none";
    }
}

function clearAllErrors() {
    document.querySelectorAll(".error").forEach(e => {
        e.innerText = "";
        e.style.display = "none";
    });
}

// Switch buttons
document.getElementById("showSignup").onclick = () => {
    loginForm.classList.remove("active");
    signupForm.classList.add("active");
    clearAllErrors();
};

document.getElementById("showLogin").onclick = () => {
    signupForm.classList.remove("active");
    loginForm.classList.add("active");
    clearAllErrors();
};

async function saveUserToFirestore(name, email) {
    try {
        console.log("User to save:");
        console.log(`name: ${name}, email: ${email}`);
        
        const usersCol = collection(db, "users");
        
        await addDoc(usersCol, {
            name: name,
            email: email,
            created_at: new Date(),
        });
        
        console.log("User saved to Firestore successfully!");
    } catch (error) {
        console.error("Error saving user:", error);
    }
}

const signUp = async (name, email, password) => {
    const submitText = signupForm.querySelector(".btn-text");
    const spinner = signupForm.querySelector(".spinner");
    const msg = signupForm.querySelector(".msg");

    submitText.style.display = "none";
    spinner.style.display = "block";

    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCred.user;
        
        await updateProfile(user, {
            displayName: name
        });

        await saveUserToFirestore(user.displayName, user.email);
        
        msg.style.display = "block";
        msg.style.color = "green";
        msg.innerText = "Successfully signed up! Redirecting...";
        console.log(user);

        // Redirect to home page after 2 seconds
        setTimeout(() => {
            window.location.href = "home.html";
        }, 2000);

    } catch(e) {
        msg.style.display = "block";
        msg.style.color = "red";
        
        if (e.code === "auth/email-already-in-use") {
            msg.innerText = "Email already registered";
        } else if (e.code === "auth/weak-password") {
            msg.innerText = "Password is too weak";
        } else {
            msg.innerText = "Sign up failed. Please try again.";
        }
        
        console.log(`error on create user: ${e}`);
    } finally {
        submitText.style.display = "block";
        spinner.style.display = "none";
    }
}

const logIn = async (email, password) => {
    const submitText = loginForm.querySelector(".btn-text");
    const spinner = loginForm.querySelector(".spinner");
    const msg = loginForm.querySelector(".msg");

    if (!submitText || !spinner) {
        console.error("Required DOM elements (submitText or spinner) were not found.");
        return;
    }

    submitText.style.display = "none";
    spinner.style.display = "block";

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        msg.style.display = "block";
        msg.style.color = "green";
        msg.innerText = "Successfully logged in! Redirecting...";
        console.log(`user login successfully: ${user}`);

        // Redirect to home page after 1.5 seconds
        setTimeout(() => {
            window.location.href = "home.html";
        }, 1500);

    } catch(e) {
        msg.style.display = "block";
        msg.style.color = "red";
        
        if (e.code === "auth/user-not-found" || e.code === "auth/wrong-password") {
            msg.innerText = "Invalid email or password";
        } else if (e.code === "auth/invalid-credential") {
            msg.innerText = "Invalid credentials";
        } else {
            msg.innerText = "Login failed. Please try again.";
        }
        
        console.log(`user login failed ${e}`);
    } finally {
        submitText.style.display = "block";
        spinner.style.display = "none";
    }
}

/* ================= SIGN UP ================= */
signupForm.addEventListener("submit", function (e) {
    e.preventDefault();
    clearAllErrors();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirm = document.getElementById("signupConfirm").value;

    let hasError = false;

    // Validate name
    if (!name) {
        setError("signupNameError", "Full name is required");
        hasError = true;
    }

    // Validate email
    if (!email) {
        setError("signupEmailError", "Email is required");
        hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("signupEmailError", "Please enter a valid email address");
        hasError = true;
    }

    // Validate password
    if (!password) {
        setError("signupPasswordError", "Password is required");
        hasError = true;
    } else if (password.length < 6) {
        setError("signupPasswordError", "Password must be at least 6 characters");
        hasError = true;
    }

    // Validate confirm password
    if (!confirm) {
        setError("signupConfirmError", "Please confirm your password");
        hasError = true;
    } else if (password !== confirm) {
        setError("signupConfirmError", "Passwords do not match");
        hasError = true;
    }

    if (hasError) return;

    signUp(name, email, password);
});

/* ================= LOGIN ================= */
loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    clearAllErrors();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    let hasError = false;

    // Validate email
    if (!email) {
        setError("loginEmailError", "Email is required");
        hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("loginEmailError", "Please enter a valid email address");
        hasError = true;
    }

    // Validate password
    if (!password) {
        setError("loginPasswordError", "Password is required");
        hasError = true;
    }

    if (hasError) return;

    logIn(email, password);
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
